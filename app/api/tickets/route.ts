import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import TicketMessage from "@/models/TicketMessage";
import Book from "@/models/Book";
import User from "@/models/User";
import KnowledgeBase from "@/models/KnowledgeBase";
import { requireAuth } from "@/lib/auth";
import { CreateTicketSchema } from "@/lib/validation";
import { classifyTicket } from "@/lib/ai/classify";
import { generateDraftReply } from "@/lib/ai/draftReply";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { user } = auth;
  await connectToDatabase();

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const priority = url.searchParams.get("priority");
  const search = url.searchParams.get("search");

  let query: any = {};

  if (user.role === "author") {
    // Authors ONLY get their own tickets
    query.authorId = user.userId;
  } else {
    // Admin filtering
    if (status && status !== "All") query.status = status;
    if (category && category !== "All") query.category = category;
    if (priority && priority !== "All") query.priority = priority;
  }

  try {
    let tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate("authorId", "name email")
      .populate("bookId", "title isbn mrp copiesSold status")
      .populate("assignedTo", "name email");

    if (search) {
      const searchLower = search.toLowerCase();
      tickets = tickets.filter(
        (t: any) =>
          t.subject.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          (t.authorId?.name && t.authorId.name.toLowerCase().includes(searchLower)) ||
          (t.bookId?.title && t.bookId.title.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      success: true,
      data: { tickets },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: error.message },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { user } = auth;
  try {
    const body = await req.json();
    const validation = CreateTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ticket input.",
            details: validation.error.format(),
          },
        },
        { status: 422 }
      );
    }

    const { bookId, subject, description } = validation.data;
    await connectToDatabase();

    // Verify book belongs to author if provided
    let book = null;
    if (bookId) {
      book = await Book.findById(bookId);
      if (book && user.role === "author" && book.authorId.toString() !== user.userId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Selected book does not belong to you.",
            },
          },
          { status: 403 }
        );
      }
    }

    // 1. SAVE TICKET FIRST BEFORE AI PROCESSING
    const newTicket = await Ticket.create({
      authorId: user.userId,
      bookId: bookId || null,
      subject,
      description,
      category: "General Inquiry",
      priority: "Medium",
      status: "Waiting for Author", // Set to Waiting for Author so author sees instant AI response
      aiGenerated: false,
    });

    // Save initial author message in ticket conversation
    await TicketMessage.create({
      ticketId: newTicket._id,
      senderId: user.userId,
      senderRole: user.role,
      message: description,
    });

    // Find admin user for AI message sender attribute
    const adminUser = await User.findOne({ role: "admin" });

    // 2. TRIGGER AI CLASSIFICATION & DRAFT REPLY IN TRY/CATCH
    let aiClassificationResult = null;
    let aiDraftReplyText = "";

    try {
      // Step A: Classify Category & Priority
      aiClassificationResult = await classifyTicket(subject, description);

      newTicket.category = aiClassificationResult.category;
      newTicket.priority = aiClassificationResult.priority;
      newTicket.aiClassification = aiClassificationResult;
      newTicket.aiPriority = aiClassificationResult.priority;
      newTicket.aiGenerated = true;

      // Step B: Retrieve Knowledge Base matching category
      const kbRecord = await KnowledgeBase.findOne({
        $or: [
          { category: aiClassificationResult.category },
          { title: { $regex: aiClassificationResult.category.split(" ")[0], $options: "i" } },
        ],
      });

      const authorRecord = await User.findById(user.userId);

      // Step C: Generate AI Response
      aiDraftReplyText = await generateDraftReply({
        authorName: authorRecord?.name || user.name,
        authorEmail: authorRecord?.email || user.email,
        bookTitle: book?.title,
        isbn: book?.isbn,
        mrp: book?.mrp,
        copiesSold: book?.copiesSold,
        royaltyEarned: book?.royaltyEarned || 0,
        royaltyPaid: book?.royaltyPaid || 0,
        royaltyPending: book?.royaltyPending || 0,
        lastRoyaltyPayoutDate: book?.lastRoyaltyPayoutDate,
        publicationDate: book?.publicationDate,
        bookStatus: book?.status,
        subject,
        description,
        category: aiClassificationResult.category,
        kbContent: kbRecord?.content || "BookLeaf support policy",
      });

      newTicket.aiDraftReply = aiDraftReplyText;
      await newTicket.save();

      // 3. POST AI RESPONSE DIRECTLY INTO AUTHOR'S CONVERSATION THREAD!
      await TicketMessage.create({
        ticketId: newTicket._id,
        senderId: adminUser ? adminUser._id : user.userId,
        senderRole: "admin",
        message: aiDraftReplyText,
      });
    } catch (aiError) {
      console.error("⚠️ AI Enrichment failed, ticket retained with defaults:", aiError);
      newTicket.category = "General Inquiry";
      newTicket.priority = "Medium";
      const fallbackReply = `Dear ${user.name},\n\nThank you for submitting your support inquiry. Our BookLeaf Support Team has received your message and will assist you shortly.\n\nWarm regards,\nBookLeaf Support Desk`;
      newTicket.aiDraftReply = fallbackReply;
      await newTicket.save();

      await TicketMessage.create({
        ticketId: newTicket._id,
        senderId: adminUser ? adminUser._id : user.userId,
        senderRole: "admin",
        message: fallbackReply,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: { ticket: newTicket },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Ticket Creation API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: error.message },
      },
      { status: 500 }
    );
  }
}

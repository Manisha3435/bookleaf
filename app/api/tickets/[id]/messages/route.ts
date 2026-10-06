import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import TicketMessage from "@/models/TicketMessage";
import User from "@/models/User";
import KnowledgeBase from "@/models/KnowledgeBase";
import Book from "@/models/Book";
import { requireAuth } from "@/lib/auth";
import { canAccessTicket } from "@/lib/permissions";
import { CreateMessageSchema } from "@/lib/validation";
import { generateDraftReply } from "@/lib/ai/draftReply";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." },
        },
        { status: 404 }
      );
    }

    if (!canAccessTicket(auth.user, ticket)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied." },
        },
        { status: 403 }
      );
    }

    const messages = await TicketMessage.find({ ticketId: id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email role");

    return NextResponse.json({
      success: true,
      data: { messages },
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "TICKET_NOT_FOUND", message: "Ticket not found." },
        },
        { status: 404 }
      );
    }

    if (!canAccessTicket(auth.user, ticket)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied." },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = CreateMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid message body.",
            details: validation.error.format(),
          },
        },
        { status: 422 }
      );
    }

    const { message } = validation.data;

    // 1. Create author or admin message
    const newMessage = await TicketMessage.create({
      ticketId: ticket._id,
      senderId: auth.user.userId,
      senderRole: auth.user.role,
      message,
    });

    const adminUser = await User.findOne({ role: "admin" });

    // 2. If message sender is AUTHOR, trigger instant OpenAI follow-up response!
    if (auth.user.role === "author") {
      ticket.status = "Waiting for Author";

      try {
        const authorRecord = await User.findById(auth.user.userId);
        const bookRecord = ticket.bookId ? await Book.findById(ticket.bookId) : null;
        const kbRecord = await KnowledgeBase.findOne({
          $or: [
            { category: ticket.category },
            { title: { $regex: (ticket.category || "General").split(" ")[0], $options: "i" } },
          ],
        });

        const aiFollowUpReply = await generateDraftReply({
          authorName: authorRecord?.name || auth.user.name,
          authorEmail: authorRecord?.email || auth.user.email,
          bookTitle: bookRecord?.title,
          isbn: bookRecord?.isbn,
          mrp: bookRecord?.mrp,
          copiesSold: bookRecord?.copiesSold,
          royaltyEarned: bookRecord?.royaltyEarned || 0,
          royaltyPaid: bookRecord?.royaltyPaid || 0,
          royaltyPending: bookRecord?.royaltyPending || 0,
          lastRoyaltyPayoutDate: bookRecord?.lastRoyaltyPayoutDate,
          publicationDate: bookRecord?.publicationDate,
          bookStatus: bookRecord?.status,
          subject: ticket.subject,
          description: message, // Current author message
          category: ticket.category,
          kbContent: kbRecord?.content || "BookLeaf support policy",
        });

        ticket.aiDraftReply = aiFollowUpReply;
        await ticket.save();

        // Save AI reply message to conversation thread
        await TicketMessage.create({
          ticketId: ticket._id,
          senderId: adminUser ? adminUser._id : auth.user.userId,
          senderRole: "admin",
          message: aiFollowUpReply,
        });
      } catch (aiErr) {
        console.error("⚠️ AI Follow-up failed:", aiErr);
      }
    } else if (auth.user.role === "admin") {
      ticket.status = "Waiting for Author";
      if (!ticket.assignedTo) {
        ticket.assignedTo = auth.user.userId as any;
      }
      await ticket.save();
    }

    const populatedMessage = await TicketMessage.findById(newMessage._id).populate(
      "senderId",
      "name email role"
    );

    return NextResponse.json(
      {
        success: true,
        data: { message: populatedMessage, ticketStatus: ticket.status },
      },
      { status: 201 }
    );
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

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import User from "@/models/User";
import Book from "@/models/Book";
import KnowledgeBase from "@/models/KnowledgeBase";
import { requireAuth } from "@/lib/auth";
import { canAccessTicket } from "@/lib/permissions";
import { generateDraftReply } from "@/lib/ai/draftReply";

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

    const author = await User.findById(ticket.authorId);
    const book = ticket.bookId ? await Book.findById(ticket.bookId) : null;
    const kbRecord = await KnowledgeBase.findOne({ category: ticket.category });

    const draftReply = await generateDraftReply({
      authorName: author?.name || "Author",
      authorEmail: author?.email || "",
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
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      kbContent: kbRecord?.content || "BookLeaf support guidelines",
    });

    ticket.aiDraftReply = draftReply;
    await ticket.save();

    return NextResponse.json({
      success: true,
      data: { draftReply },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "AI_ERROR", message: error.message },
      },
      { status: 500 }
    );
  }
}

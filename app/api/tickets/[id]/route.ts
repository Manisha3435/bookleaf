import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import InternalNote from "@/models/InternalNote";
import { requireAuth } from "@/lib/auth";
import { canAccessTicket } from "@/lib/permissions";
import { UpdateTicketSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const ticket = await Ticket.findById(id)
      .populate("authorId", "name email")
      .populate("bookId", "title isbn mrp copiesSold royaltyEarned royaltyPaid royaltyPending status publicationDate lastRoyaltyPayoutDate")
      .populate("assignedTo", "name email");

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
          error: {
            code: "FORBIDDEN",
            message: "You are not authorized to view this ticket.",
          },
        },
        { status: 403 }
      );
    }

    let internalNotes: any[] = [];
    // CRITICAL: Internal notes are ONLY fetched for ADMIN users! (Requirement #23)
    if (auth.user.role === "admin") {
      internalNotes = await InternalNote.find({ ticketId: ticket._id })
        .sort({ createdAt: 1 })
        .populate("adminId", "name email");
    }

    return NextResponse.json({
      success: true,
      data: {
        ticket,
        internalNotes: auth.user.role === "admin" ? internalNotes : undefined,
      },
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

export async function PATCH(
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
          error: {
            code: "FORBIDDEN",
            message: "You are not authorized to update this ticket.",
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = UpdateTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ticket updates.",
            details: validation.error.format(),
          },
        },
        { status: 422 }
      );
    }

    const updates = validation.data;

    // Authors can only change status
    if (auth.user.role === "author") {
      if (updates.status) {
        ticket.status = updates.status;
      }
    } else {
      // Admin manual override rules (Requirement #22)
      if (updates.category) ticket.category = updates.category;
      if (updates.priority) ticket.priority = updates.priority;
      if (updates.status) ticket.status = updates.status;
      if (updates.assignedTo !== undefined) {
        ticket.assignedTo = updates.assignedTo ? (updates.assignedTo as any) : null;
      }
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate("authorId", "name email")
      .populate("bookId", "title isbn mrp copiesSold status")
      .populate("assignedTo", "name email");

    return NextResponse.json({
      success: true,
      data: { ticket: updatedTicket },
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

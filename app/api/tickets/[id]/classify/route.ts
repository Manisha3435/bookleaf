import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import { requireAuth } from "@/lib/auth";
import { canAccessTicket } from "@/lib/permissions";
import { classifyTicket } from "@/lib/ai/classify";

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

    const classification = await classifyTicket(ticket.subject, ticket.description);

    ticket.aiClassification = classification;
    ticket.aiPriority = classification.priority;
    ticket.category = classification.category;
    ticket.priority = classification.priority;
    ticket.aiGenerated = true;

    await ticket.save();

    return NextResponse.json({
      success: true,
      data: { ticket, classification },
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

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import InternalNote from "@/models/InternalNote";
import { requireRole } from "@/lib/auth";
import { CreateInternalNoteSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // STRICT ADMIN AUTHORIZATION CHECK (Requirement #23)
  const auth = await requireRole(req, "admin");
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const notes = await InternalNote.find({ ticketId: id })
      .sort({ createdAt: 1 })
      .populate("adminId", "name email");

    return NextResponse.json({
      success: true,
      data: { notes },
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
  // STRICT ADMIN AUTHORIZATION CHECK (Requirement #23)
  const auth = await requireRole(req, "admin");
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

    const body = await req.json();
    const validation = CreateInternalNoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid internal note content.",
            details: validation.error.format(),
          },
        },
        { status: 422 }
      );
    }

    const { note } = validation.data;

    const newNote = await InternalNote.create({
      ticketId: ticket._id,
      adminId: auth.user.userId,
      note,
    });

    const populatedNote = await InternalNote.findById(newNote._id).populate(
      "adminId",
      "name email"
    );

    return NextResponse.json(
      {
        success: true,
        data: { note: populatedNote },
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

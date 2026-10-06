import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "admin");
  if (auth.error) return auth.error;

  await connectToDatabase();

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const priority = url.searchParams.get("priority");
  const sort = url.searchParams.get("sort") || "newest";
  const search = url.searchParams.get("search");

  let query: any = {};

  if (status && status !== "All") query.status = status;
  if (category && category !== "All") query.category = category;
  if (priority && priority !== "All") query.priority = priority;

  try {
    let sortOptions: any = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };

    let tickets = await Ticket.find(query)
      .sort(sortOptions)
      .populate("authorId", "name email")
      .populate("bookId", "title isbn mrp copiesSold status")
      .populate("assignedTo", "name email");

    // Client-side priority sorting if requested
    if (sort === "critical_first") {
      const pOrder: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
      tickets.sort((a, b) => (pOrder[a.priority] || 5) - (pOrder[b.priority] || 5));
    } else if (sort === "high_first") {
      const pOrder: Record<string, number> = { High: 1, Critical: 2, Medium: 3, Low: 4 };
      tickets.sort((a, b) => (pOrder[a.priority] || 5) - (pOrder[b.priority] || 5));
    }

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

    // Dashboard Statistics Calculation
    const allTickets = await Ticket.find();
    const stats = {
      total: allTickets.length,
      open: allTickets.filter((t) => t.status === "Open").length,
      critical: allTickets.filter((t) => t.priority === "Critical").length,
      high: allTickets.filter((t) => t.priority === "High").length,
      resolved: allTickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length,
      pending: allTickets.filter((t) => t.status === "In Progress" || t.status === "Waiting for Author").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        stats,
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

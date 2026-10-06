import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Book from "@/models/Book";
import { requireAuth } from "@/lib/auth";
import { CreateBookSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { user } = auth;
  await connectToDatabase();

  const url = new URL(req.url);
  const requestedAuthorId = url.searchParams.get("authorId");
  const searchQuery = url.searchParams.get("search") || url.searchParams.get("q") || "";
  const genre = url.searchParams.get("genre");
  const status = url.searchParams.get("status");

  let query: any = {};

  if (user.role === "author") {
    query.authorId = user.userId;
  } else if (requestedAuthorId) {
    query.authorId = requestedAuthorId;
  }

  if (genre) {
    query.genre = { $regex: genre, $options: "i" };
  }

  if (status) {
    query.status = status;
  }

  if (searchQuery) {
    query.$or = [
      { title: { $regex: searchQuery, $options: "i" } },
      { isbn: { $regex: searchQuery, $options: "i" } },
      { book_id: { $regex: searchQuery, $options: "i" } },
      { bookIdCode: { $regex: searchQuery, $options: "i" } },
      { genre: { $regex: searchQuery, $options: "i" } },
      { print_partner: { $regex: searchQuery, $options: "i" } },
    ];
  }

  try {
    const books = await Book.find(query).sort({ createdAt: -1 }).populate("authorId", "name email author_id authorId");

    return NextResponse.json({
      success: true,
      data: { books },
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
  await connectToDatabase();

  try {
    const body = await req.json();
    const validation = CreateBookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid book parameters.",
            details: validation.error.format(),
          },
        },
        { status: 422 }
      );
    }

    const data = validation.data;
    const authorId = user.role === "author" ? user.userId : (data.authorId || user.userId);
    const book_id = data.book_id || data.bookIdCode || `BK${Math.floor(100 + Math.random() * 900)}`;

    const total_copies_sold = data.total_copies_sold ?? data.copiesSold ?? 0;
    const author_royalty_per_copy = data.author_royalty_per_copy ?? data.authorRoyaltyPerCopy ?? 0;
    const mrp = data.mrp ?? 0;
    const total_royalty_earned = data.total_royalty_earned ?? data.royaltyEarned ?? (total_copies_sold * author_royalty_per_copy);
    const royalty_paid = data.royalty_paid ?? data.royaltyPaid ?? 0;
    const royalty_pending = data.royalty_pending ?? data.royaltyPending ?? Math.max(0, total_royalty_earned - royalty_paid);

    const publication_date = data.publication_date ? new Date(data.publication_date) : data.publicationDate ? new Date(data.publicationDate) : new Date();
    const last_royalty_payout_date = data.last_royalty_payout_date ? new Date(data.last_royalty_payout_date) : data.lastRoyaltyPayoutDate ? new Date(data.lastRoyaltyPayoutDate) : null;

    const available_on = data.available_on && data.available_on.length > 0 ? data.available_on : data.availableOn && data.availableOn.length > 0 ? data.availableOn : ["Amazon India", "Flipkart", "Amazon US", "BookLeaf Store"];

    const newBook = await Book.create({
      authorId,
      book_id,
      bookIdCode: book_id,
      title: data.title,
      isbn: data.isbn,
      genre: data.genre,
      mrp,
      author_royalty_per_copy,
      authorRoyaltyPerCopy: author_royalty_per_copy,
      total_copies_sold,
      copiesSold: total_copies_sold,
      total_royalty_earned,
      royaltyEarned: total_royalty_earned,
      royalty_paid,
      royaltyPaid: royalty_paid,
      royalty_pending,
      royaltyPending: royalty_pending,
      publication_date,
      publicationDate: publication_date,
      last_royalty_payout_date,
      lastRoyaltyPayoutDate: last_royalty_payout_date,
      print_partner: data.print_partner || data.printPartner || "Repro India",
      printPartner: data.printPartner || data.print_partner || "Repro India",
      available_on,
      availableOn: available_on,
      status: data.status || "Published & Live",
    });

    const populatedBook = await Book.findById(newBook._id).populate("authorId", "name email author_id authorId");

    return NextResponse.json(
      {
        success: true,
        data: { book: populatedBook },
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

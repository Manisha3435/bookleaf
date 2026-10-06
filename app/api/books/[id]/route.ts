import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Book from "@/models/Book";
import { requireAuth } from "@/lib/auth";
import { canAccessBook } from "@/lib/permissions";
import { UpdateBookSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const book = await Book.findById(id).populate("authorId", "name email author_id authorId");
    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BOOK_NOT_FOUND", message: "Book not found." },
        },
        { status: 404 }
      );
    }

    if (!canAccessBook(auth.user, book)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You are not authorized to view this book.",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { book },
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BOOK_NOT_FOUND", message: "Book not found." },
        },
        { status: 404 }
      );
    }

    if (!canAccessBook(auth.user, book)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You are not authorized to modify this book.",
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = UpdateBookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update fields.",
            details: validation.error.format(),
          },
        },
        { status: 422 }
      );
    }

    const data = validation.data;

    if (data.title !== undefined) book.title = data.title;
    if (data.isbn !== undefined) book.isbn = data.isbn;
    if (data.genre !== undefined) book.genre = data.genre;
    if (data.mrp !== undefined) book.mrp = data.mrp;
    if (data.status !== undefined) book.status = data.status;

    if (data.book_id !== undefined || data.bookIdCode !== undefined) {
      const code = data.book_id || data.bookIdCode;
      if (code) {
        book.book_id = code;
        book.bookIdCode = code;
      }
    }

    if (data.author_royalty_per_copy !== undefined || data.authorRoyaltyPerCopy !== undefined) {
      const perCopy = data.author_royalty_per_copy ?? data.authorRoyaltyPerCopy ?? 0;
      book.author_royalty_per_copy = perCopy;
      book.authorRoyaltyPerCopy = perCopy;
    }

    if (data.total_copies_sold !== undefined || data.copiesSold !== undefined) {
      const sold = data.total_copies_sold ?? data.copiesSold ?? 0;
      book.total_copies_sold = sold;
      book.copiesSold = sold;
    }

    if (data.total_royalty_earned !== undefined || data.royaltyEarned !== undefined) {
      const earned = data.total_royalty_earned ?? data.royaltyEarned ?? 0;
      book.total_royalty_earned = earned;
      book.royaltyEarned = earned;
    }

    if (data.royalty_paid !== undefined || data.royaltyPaid !== undefined) {
      const paid = data.royalty_paid ?? data.royaltyPaid ?? 0;
      book.royalty_paid = paid;
      book.royaltyPaid = paid;
    }

    if (data.royalty_pending !== undefined || data.royaltyPending !== undefined) {
      const pending = data.royalty_pending ?? data.royaltyPending ?? 0;
      book.royalty_pending = pending;
      book.royaltyPending = pending;
    }

    if (data.publication_date !== undefined || data.publicationDate !== undefined) {
      const pubDate = data.publication_date ? new Date(data.publication_date) : data.publicationDate ? new Date(data.publicationDate) : null;
      book.publication_date = pubDate;
      book.publicationDate = pubDate;
    }

    if (data.last_royalty_payout_date !== undefined || data.lastRoyaltyPayoutDate !== undefined) {
      const payoutDate = data.last_royalty_payout_date ? new Date(data.last_royalty_payout_date) : data.lastRoyaltyPayoutDate ? new Date(data.lastRoyaltyPayoutDate) : null;
      book.last_royalty_payout_date = payoutDate;
      book.lastRoyaltyPayoutDate = payoutDate;
    }

    if (data.print_partner !== undefined || data.printPartner !== undefined) {
      const partner = data.print_partner || data.printPartner || "BookLeaf Press";
      book.print_partner = partner;
      book.printPartner = partner;
    }

    if (data.available_on !== undefined || data.availableOn !== undefined) {
      const platforms = data.available_on || data.availableOn || ["BookLeaf Store"];
      book.available_on = platforms;
      book.availableOn = platforms;
    }

    if (auth.user.role === "admin" && data.authorId) {
      book.authorId = data.authorId as any;
    }

    await book.save();

    const updatedBook = await Book.findById(id).populate("authorId", "name email author_id authorId");

    return NextResponse.json({
      success: true,
      data: { book: updatedBook },
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BOOK_NOT_FOUND", message: "Book not found." },
        },
        { status: 404 }
      );
    }

    if (!canAccessBook(auth.user, book)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You are not authorized to delete this book.",
          },
        },
        { status: 403 }
      );
    }

    await Book.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully.",
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

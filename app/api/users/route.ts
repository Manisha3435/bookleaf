import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";
import { CreateUserSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "admin");
  if (auth.error) return auth.error;

  await connectToDatabase();

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("search") || searchParams.get("q") || "";
    const role = searchParams.get("role") || "";

    const filter: any = {};
    if (role && (role === "admin" || role === "author")) {
      filter.role = role;
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { author_id: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
      ];
    }

    const users = await User.find(filter, "-passwordHash").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { users },
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
  const auth = await requireRole(req, "admin");
  if (auth.error) return auth.error;

  await connectToDatabase();

  try {
    const body = await req.json();
    const validation = CreateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input fields.",
            details: validation.error.format(),
          },
        },
        { status: 422 }
      );
    }

    const { author_id, name, email, password, phone, city, joined_date, role } = validation.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "A user with this email address already exists.",
          },
        },
        { status: 409 }
      );
    }

    const plainPassword = password && password.trim() !== "" ? password : "author123";
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const parsedJoinedDate = joined_date ? new Date(joined_date) : new Date();

    const newUser = await User.create({
      author_id: author_id || `AUTH${Math.floor(100 + Math.random() * 900)}`,
      authorId: author_id || `AUTH${Math.floor(100 + Math.random() * 900)}`,
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      city: city || "",
      joined_date: parsedJoinedDate,
      passwordHash,
      role: role || "author",
    });

    const userObj = newUser.toObject();
    delete (userObj as any).passwordHash;

    return NextResponse.json(
      {
        success: true,
        data: { user: userObj },
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

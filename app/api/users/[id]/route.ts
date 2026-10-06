import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";
import { UpdateUserSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "admin");
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const user = await User.findById(id, "-passwordHash");
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found." },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
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
  const auth = await requireRole(req, "admin");
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const body = await req.json();
    const validation = UpdateUserSchema.safeParse(body);

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

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found." },
        },
        { status: 404 }
      );
    }

    const { author_id, name, email, password, phone, city, joined_date, role } = validation.data;

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "EMAIL_ALREADY_EXISTS",
              message: "Another user with this email address already exists.",
            },
          },
          { status: 409 }
        );
      }
      user.email = email.toLowerCase();
    }

    if (name !== undefined) user.name = name;
    if (author_id !== undefined) {
      user.author_id = author_id;
      user.authorId = author_id;
    }
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (joined_date !== undefined) {
      user.joined_date = new Date(joined_date);
    }
    if (role !== undefined) user.role = role;

    if (password && password.trim() !== "") {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    return NextResponse.json({
      success: true,
      data: { user: userObj },
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
  const auth = await requireRole(req, "admin");
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectToDatabase();

  try {
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found." },
        },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
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

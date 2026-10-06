import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "./jwt";
import connectToDatabase from "./mongodb";
import User, { IUser } from "../models/User";

export const AUTH_COOKIE_NAME = "auth-token";

export async function getUserFromRequest(
  req: NextRequest
): Promise<TokenPayload | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    // Check Authorization header fallback
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const bearerToken = authHeader.substring(7);
      return verifyToken(bearerToken);
    }
    return null;
  }
  return verifyToken(token);
}

export async function requireAuth(req: NextRequest): Promise<{
  user: TokenPayload;
  error?: NextResponse;
}> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return {
      user: null as any,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access this resource.",
          },
        },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export async function requireRole(
  req: NextRequest,
  requiredRole: "admin" | "author"
): Promise<{
  user: TokenPayload;
  error?: NextResponse;
}> {
  const authResult = await requireAuth(req);
  if (authResult.error) return authResult;

  if (authResult.user.role !== requiredRole && authResult.user.role !== "admin") {
    return {
      user: authResult.user,
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `Access denied. Requires '${requiredRole}' role.`,
          },
        },
        { status: 403 }
      ),
    };
  }

  return { user: authResult.user };
}

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bookleaf_super_secret_jwt_key_2026_safe_hash";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: "author" | "admin";
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

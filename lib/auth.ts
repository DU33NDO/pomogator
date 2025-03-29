import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

interface AuthPayload {
  userId: string;
  role: string;
  email?: string;
}

export function verifyAuth(request: NextRequest): AuthPayload | null {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) return null;

    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as AuthPayload;
  } catch {
    return null;
  }
} 
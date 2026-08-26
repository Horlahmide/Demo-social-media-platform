import { verifyToken } from "@/lib/jwt";
import { NextResponse, NextRequest } from "next/server";

export interface JwtUserPayload {
  id: string;
  iat: number;
  exp: number;
}

export function authenticate(
  request: NextRequest,
): JwtUserPayload | NextResponse {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "No authorization header or invalid format" },
      { status: 401 },
    );
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return NextResponse.json(
      { message: "Invalid authorization format" },
      { status: 401 },
    );
  }

  const payload = verifyToken(token) as JwtUserPayload;
  if (!payload) {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 },
    );
  }

  return payload;
}

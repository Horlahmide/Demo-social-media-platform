import { connectDB } from "@/lib/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import User from "@/models/user";
import { generateToken } from "@/lib/jwt";
import { rateLimit } from "@/lib/validations/rate-limit";
import { loginSchema } from "@/lib/validations/auth";
import { handleError } from "@/lib/errorHandler";

export async function POST(request: Request) {
  console.log("📥 [POST] /api/auth/login request received");
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    console.log("Login attempt from IP:", ip);

    const rateLimitResult = rateLimit(ip, 100, 60 * 1000);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: "Too many requests, please try again later",
        },
        {
          status: 429,
        },
      );
    }

    const body = await request.json();

    // Zod validation: validates + trims + lowercases email before DB query
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return handleError(validation.error);
    }

    const { email, password } = validation.data;

    await connectDB();

    // Email is already normalized (lowercased) by Zod so this matches consistently
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid email or password",
        },
        {
          status: 401,
        },
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        {
          message: "Invalid email or password",
        },
        {
          status: 401,
        },
      );
    }

    const token = generateToken(user._id.toString());

    return NextResponse.json(
      {
        message: "Login successful",
        token,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return handleError(error);
  }
}

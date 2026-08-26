import { connectDB } from "@/lib/db";
import User from "@/models/user";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { handleError } from "@/lib/errorHandler";
import { generateVerificationToken, hashToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  console.log("📥 [POST] /api/auth/register request received");
  try {
    const body = await request.json();

    // Zod validation: validates + trims + lowercases email
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return handleError(validation.error);
    }

    const { username, email, password } = validation.data;

    await connectDB();

    // Option A: Manual duplicate email check for a user-friendly error message
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "An account with this email already exists",
        },
        {
          status: 409,
        },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const hashedToken = hashToken(verificationToken);
    const verificationTokenExpires = new Date(Date.now() + 30 * 60 * 1000);

    await User.create({
      username,
      email,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationTokenHash: hashedToken,
      emailVerificationTokenExpires: verificationTokenExpires,
    });
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        message: "User created successfully",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleError(error);
  }
}

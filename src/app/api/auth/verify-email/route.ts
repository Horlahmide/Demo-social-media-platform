import { connectDB } from "@/lib/db";
import User from "@/models/user";
import { hashToken } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    const rateLimitResponse = rateLimit(request, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);


    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          message: "Verification token is required",
        },
        {
          status: 400,
        },
      );
    }

    const hashedToken = hashToken(token);

    await connectDB();

    const user = await User.findOne({
      emailVerificationTokenHash: hashedToken,
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid verification token",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !user.emailVerificationTokenExpires ||
      user.emailVerificationTokenExpires < new Date()
    ) {
      return NextResponse.json(
        {
          message: "Verification token has expired",
        },
        {
          status: 400,
        },
      );
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpires = null;

    await user.save();

    return NextResponse.json(
      {
        message: "Email verified successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}

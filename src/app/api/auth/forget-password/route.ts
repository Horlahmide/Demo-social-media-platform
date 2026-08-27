import { connectDB } from "@/lib/db";
import User from "@/models/user";
import { generateVerificationToken, hashToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const rateLimitResponse = rateLimit(request, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();


    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          message: "Email is required",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    // Don't reveal whether the account exists.
    if (!user) {
      return NextResponse.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = generateVerificationToken();
    const resetTokenHash = hashToken(resetToken);

    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);

    user.passwordResetTokenHash = resetTokenHash;
    user.passwordResetTokenExpires = resetTokenExpires;

    await user.save();

    await sendPasswordResetEmail(email, resetToken);
    console.log("Reset token:", resetToken);

    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error(error);

    return handleError(error);
  }
}

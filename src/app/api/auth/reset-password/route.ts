import { connectDB } from "@/lib/db";
import User from "@/models/user";
import bcrypt from "bcrypt";
import { hashToken } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
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

    const { searchParams } = new URL(request.url);

    const body = await request.json().catch(() => ({}));

    // Allow token from JSON body OR URL searchParams for flexibility
    const token = body.token || searchParams.get("token");
    const newPassword = body.newPassword || body.password;

    const validation = resetPasswordSchema.safeParse({ token, newPassword });

    if (!validation.success) {
      return handleError(validation.error);
    }

    const hashedToken = hashToken(validation.data.token);

    await connectDB();

    const user = await User.findOne({
      passwordResetTokenHash: hashedToken,
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid or expired password reset token",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !user.passwordResetTokenExpires ||
      user.passwordResetTokenExpires < new Date()
    ) {
      return NextResponse.json(
        {
          message: "Password reset token has expired",
        },
        {
          status: 400,
        },
      );
    }

    const hashedPassword = await bcrypt.hash(validation.data.newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpires = null;

    await user.save();

    return NextResponse.json(
      {
        message: "Password reset successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return handleError(error);
  }
}

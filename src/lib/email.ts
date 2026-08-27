import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
) {
  const verificationUrl = `http://localhost:3000/api/auth/verify-email?token=${verificationToken}`;

  const { data, error } = await resend.emails.send({
    from: "Social Media App <onboarding@resend.dev>",
    to: [email],
    subject: "Verify your email",
    html: `
      <h1>Verify your email</h1>

      <p>
        Thanks for creating an account.
      </p>

      <p>
        Click the link below to verify your email address:
      </p>

      <a href="${verificationUrl}">
        Verify my email
      </a>

      <p>
        This link will expire in 30 minutes.
      </p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
) {
  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

  const { data, error } = await resend.emails.send({
    from: "Social Media App <onboarding@resend.dev>",
    to: [email],
    subject: "Reset your password",
    html: `
      <h1>Reset your password</h1>

      <p>
        You requested a password reset for your account.
      </p>

      <p>
        Click the link below to set a new password:
      </p>

      <a href="${resetUrl}">
        Reset my password
      </a>

      <p>
        This link will expire in 30 minutes.
      </p>

      <p>
        If you did not request this, please ignore this email.
      </p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


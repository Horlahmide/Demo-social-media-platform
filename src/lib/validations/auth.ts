import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string({ error: "Username must be a string" })
    .trim()
    .min(3, { error: "Username must be at least 3 characters long" })
    .max(30, { error: "Username must be at most 30 characters long" })
    .regex(/^[a-zA-Z0-9_]+(?: [a-zA-Z0-9_]+)*$/, {
      error:
        "Username can only contain letters, numbers, underscores, and single spaces between words",
    }),

  email: z
    .string({ error: "Email must be a string" })
    .trim()
    .toLowerCase()
    .email({ error: "Please provide a valid email address" })
    .max(254, { error: "Email must be at most 254 characters long" }),

  password: z
    .string({ error: "Password must be a string" })
    .min(8, { error: "Password must be at least 8 characters long" })
    .max(64, { error: "Password must be at most 64 characters long" })
    .regex(/[A-Z]/, {
      error: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      error: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { error: "Password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, {
      error: "Password must contain at least one special character",
    }),
});

export const loginSchema = z.object({
  email: z
    .string({ error: "Email must be a string" })
    .trim()
    .toLowerCase()
    .email({ error: "Please provide a valid email address" }),

  // For login, we only check the field is present — no complexity checks
  // because bcrypt.compare() handles verification against the stored hash
  password: z
    .string({ error: "Password must be a string" })
    .min(1, { error: "Password is required" }),
});

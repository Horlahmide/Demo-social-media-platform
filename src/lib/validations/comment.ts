import { z } from "zod";

export const createCommentSchema = z
  .object({
    content: z
      .string({
        error: "Comment must be a string",
      })
      .trim()
      .min(1, {
        error: "Comment cannot be empty",
      })
      .max(1000, {
        error: "Comment cannot exceed 1000 characters",
      }),
  })
  .strict();

export const updateCommentSchema = z
  .object({
    content: z
      .string({
        error: "Comment must be a string",
      })
      .trim()
      .min(1, {
        error: "Comment cannot be empty",
      })
      .max(1000, {
        error: "Comment cannot exceed 1000 characters",
      }),
  })
  .strict();

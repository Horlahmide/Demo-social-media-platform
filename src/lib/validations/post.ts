import { z } from "zod";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const createPostSchema = z.object({
  title: z
    .string({ error: "Title must be a string" })
    .trim()
    .min(3, { error: "Title must be at least 3 characters long" })
    .max(100, { error: "Title must be at most 100 characters long" }),
  content: z
    .string({ error: "Content must be a string" })
    .trim()
    .min(10, { error: "Content must be at least 10 characters long" }),
  image: z
    .instanceof(File, { message: "Image must be a file" })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "Image size must be at most 5MB",
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Only JPEG, PNG, and WEBP image formats are supported",
    })
    .optional(),
});

//   update schema validation with optional fields
export const updatePostSchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),

    content: z.string().trim().min(10).optional(),
    image: z
      .instanceof(File, { message: "Image must be a file" })
      .refine((file) => file.size <= MAX_FILE_SIZE, {
        message: "Image size must be at most 5MB",
      })
      .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
        message: "Only JPEG, PNG, and WEBP image formats are supported",
      })
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.image !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

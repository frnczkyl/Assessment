import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(500_000).optional(),
});

export const updateDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty.").max(200).optional(),
    content: z.string().max(500_000).optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "Nothing to update.",
  });

export const shareSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["viewer", "editor"]).default("editor"),
});

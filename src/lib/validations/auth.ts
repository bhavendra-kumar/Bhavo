import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Please provide a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  // Client-supplied role is ignored server-side to prevent privilege escalation; public registration creates RIDER
  role: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Please provide a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
});

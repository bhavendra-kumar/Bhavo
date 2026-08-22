import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Please provide a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  role: z.enum(["RIDER", "DRIVER"]).default("RIDER").optional(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Please provide a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
});

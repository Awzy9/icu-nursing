import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(12).max(128);

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    displayName: z.string().trim().min(1).max(80),
    experience: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "mismatch" });

export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const resetRequestSchema = z.object({ email: emailSchema });
export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "mismatch" });
export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  experience: z.enum(["beginner", "intermediate", "advanced"]).optional().or(z.literal("").transform(() => undefined)),
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).optional().or(z.literal("").transform(() => undefined)),
  locale: z.enum(["en", "ar"]),
});

/** Map the first zod issue to an Auth.errors.* translation key. */
export function errorKey(issue: z.ZodIssue | undefined): string {
  if (!issue) return "generic";
  const field = String(issue.path[0] ?? "");
  if (field === "email") return "invalidEmail";
  if (field === "password") return "passwordTooShort";
  if (field === "confirmPassword") return "passwordsMismatch";
  if (field === "displayName") return "nameRequired";
  return "generic";
}

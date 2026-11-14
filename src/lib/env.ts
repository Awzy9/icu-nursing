import { z } from "zod";

/**
 * Environment validation. Only PUBLIC variables are read; the Supabase service-role key is
 * deliberately not part of this application's configuration.
 */
const schema = z
  .object({
    NEXT_PUBLIC_SITE_URL: z
      .string()
      .url()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .url()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .min(20, "anon key looks too short")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
      .string()
      .regex(/^[0-9A-Za-z_-]{10,64}$/, "unexpected Turnstile site key format")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    NEXT_PUBLIC_APP_ENV: z.enum(["development", "staging", "production"]).optional().or(z.literal("").transform(() => undefined)),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .superRefine((v, ctx) => {
    const hasUrl = Boolean(v.NEXT_PUBLIC_SUPABASE_URL);
    const hasKey = Boolean(v.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasUrl !== hasKey) {
      ctx.addIssue({
        code: "custom",
        message: "Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or neither (demo mode).",
        path: ["NEXT_PUBLIC_SUPABASE_URL"],
      });
    }
    if (v.NODE_ENV === "production" && hasUrl && !v.NEXT_PUBLIC_SITE_URL) {
      ctx.addIssue({
        code: "custom",
        message: "NEXT_PUBLIC_SITE_URL is required in production when Supabase is configured.",
        path: ["NEXT_PUBLIC_SITE_URL"],
      });
    }
  });

export type Env = z.infer<typeof schema> & { demoMode: boolean; captchaEnabled: boolean; indexable: boolean };

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = schema.safeParse({
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: source.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_APP_ENV: source.NEXT_PUBLIC_APP_ENV,
    NODE_ENV: source.NODE_ENV,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".") || "env"}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${msg}`);
  }
  const d = parsed.data;
  const demoMode = !(d.NEXT_PUBLIC_SUPABASE_URL && d.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  // Search engines may index ONLY an explicitly declared production deployment. Anything else (staging, previews, local) is noindex.
  return { ...d, demoMode, captchaEnabled: !demoMode && Boolean(d.NEXT_PUBLIC_TURNSTILE_SITE_KEY), indexable: d.NEXT_PUBLIC_APP_ENV === "production" };
}

let cached: Env | undefined;
export function getEnv(): Env {
  // Next.js inlines NEXT_PUBLIC_* only for direct property access, so list them explicitly.
  cached ??= parseEnv({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NODE_ENV: process.env.NODE_ENV,
  });
  return cached;
}

export const isDemoMode = () => getEnv().demoMode;

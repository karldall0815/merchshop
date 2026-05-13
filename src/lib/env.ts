import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 chars"),
  DATABASE_URL: z.string().url(),
  ALLOW_SETUP_REINIT: z.enum(["true", "false"]).default("false"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  MAIL_FROM: z.string().optional(),
  DHL_API_KEY: z.string().optional(),
  DHL_USER: z.string().optional(),
  DHL_PASSWORD: z.string().optional(),
  DHL_ACCOUNT_NUMBER: z.string().optional(),
  DHL_ENVIRONMENT: z.enum(["sandbox", "production"]).optional(),
  JOBS_TOKEN: z.string().min(16).optional(),
});

export type Env = z.infer<typeof schema>;

// Lazy parsing: schema.parse() läuft erst beim ersten Property-Zugriff auf `env`.
// Vermeidet, dass `next build` schon zur Build-Zeit Runtime-Secrets (NEXTAUTH_SECRET,
// DATABASE_URL …) braucht. Bei fehlenden Werten schlägt die Validierung erst zur
// Runtime fehl, was korrekt ist (Container ohne Secrets soll nicht starten).
let cached: Env | null = null;
function ensure(): Env {
  if (cached === null) cached = schema.parse(process.env);
  return cached;
}
export const env = new Proxy({} as Env, {
  get: (_target, prop: string) => ensure()[prop as keyof Env],
  has: (_target, prop: string) => prop in ensure(),
  ownKeys: () => Object.keys(ensure()),
  getOwnPropertyDescriptor: (_target, prop: string) => ({
    enumerable: true,
    configurable: true,
    value: ensure()[prop as keyof Env],
  }),
});

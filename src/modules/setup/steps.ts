export const STEP_IDS = [
  "welcome",
  "system-check",
  "branding",
  "admin",
  "storage",
  "email",
  "shipping",
  "defaults",
  "users",
  "review",
] as const;

export type StepId = (typeof STEP_IDS)[number];

// envVarsMatch: "all" → step counts as ENV-complete only when EVERY listed var is set
//                       (e.g. storage needs endpoint + bucket + access + secret all four)
//               "any" → at least one listed var is enough
//                       (e.g. email accepts either RESEND_API_KEY or SMTP_HOST)
// Default: "all" — the safer choice; "any" must be opted in.
export type StepDescriptor = {
  required: boolean;
  envVars?: string[];
  envVarsMatch?: "any" | "all";
};

export const STEPS: Record<StepId, StepDescriptor> = {
  welcome: { required: false },
  "system-check": { required: false },
  branding: { required: true },
  admin: { required: true },
  storage: {
    required: true,
    envVars: ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY"],
    envVarsMatch: "all",
  },
  email: {
    required: true,
    envVars: ["RESEND_API_KEY", "SMTP_HOST"],
    envVarsMatch: "any",
  },
  shipping: { required: false, envVars: ["DHL_API_KEY"], envVarsMatch: "all" },
  defaults: { required: false },
  users: { required: false },
  review: { required: true },
};

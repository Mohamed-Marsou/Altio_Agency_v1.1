import { z } from "zod";

// All environment variables are read and checked HERE, once, when the server
// starts. If something is missing or wrong the server refuses to start and says
// exactly what (much better than a mystery crash later). The rest of the code
// imports `env` and never touches process.env directly.
//
// Values come from apps/api/.env (see .env.example). Node loads that file
// through the --env-file flag in the npm scripts.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // The two front-ends allowed to call the API (CORS allow-list).
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  ADMIN_ORIGIN: z.string().url().default("http://localhost:3001"),

  // Not needed until the database is wired in (next step), so optional for now.
  DATABASE_URL: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";

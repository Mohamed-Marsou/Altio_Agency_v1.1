import path from "node:path";
import type { NextConfig } from "next";

// Static export is only switched on for the Hostinger build (npm run build:export).
const isExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  output: isExport ? "export" : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,

  // Next 16.4 writes an AGENTS.md file for AI tools on every `dev` start. We do not want it in git.
  agentRules: false,

  // One 404 page for the whole site (app/global-not-found.tsx), because the
  // public site and the admin area have separate root layouts.
  experimental: { globalNotFound: true },

  // Lets any .scss file write  @use "abstracts" as *;  instead of long
  // relative paths: Sass will also look for it inside src/styles.
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src", "styles")],
  },
};

export default nextConfig;

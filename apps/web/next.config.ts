import path from "node:path";
import type { NextConfig } from "next";

// Static export is only switched on for the Hostinger build (npm run build:export).
const isExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  output: isExport ? "export" : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,

  // Lets any .scss file write  @use "abstracts" as *;  instead of long
  // relative paths: Sass will also look for it inside src/styles.
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src", "styles")],
  },
};

export default nextConfig;

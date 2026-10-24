import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit and component tests. Playwright (end to end) has its own config.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    globals: true,
    css: { modules: { classNameStrategy: "non-scoped" } },
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,mjs}"],
    coverage: {
      provider: "v8",
      // The LOGIC of the site (forms, content, SEO, admin rules, file storage, error log format).
      // The look of the pages is covered by the browser tests (npm run e2e), not by this number.
      include: [
        "src/lib/forms/**",
        "src/lib/i18n.ts",
        "src/lib/format.ts",
        "src/lib/seo.ts",
        "src/lib/content.ts",
        "src/lib/admin/{schemas,store,mediaPipeline,devApi,helpers}.ts",
        "src/lib/logger/format.ts",
      ],
      exclude: ["**/*.test.*"],
      reporter: ["text-summary", "html"],
      // The build fails when coverage drops under these numbers.
      thresholds: { lines: 85, functions: 80, branches: 75, statements: 85 },
    },
  },
});

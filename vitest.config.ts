import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Integration tests share one dev SQLite DB; running files in parallel races their
    // cleanup deletes ("No record found for delete"). Serialize files for determinism.
    fileParallelism: false,
  },
});

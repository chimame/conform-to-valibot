import { defineConfig } from "tsup";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig([
  {
    entry: ["index.ts"],
    clean: true,
    dts: true,
    format: ["cjs", "esm"],
    minify: isProduction,
    sourcemap: false,
  },
]);

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Trace workspace packages (@repo/db, @repo/ui) into the standalone output
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;

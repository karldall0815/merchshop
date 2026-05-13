import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" output collects only the necessary node_modules into
  // .next/standalone so the runtime image is small. Matches the COPY pattern
  // in Dockerfile.
  output: "standalone",
  // Treat Prisma as an external package so the runtime requires it from
  // node_modules rather than bundling it. Needed for standalone output to
  // pick up Prisma's native query engine binaries correctly.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // pnpm scatters the generated Prisma client under .pnpm/, which Next.js's
  // tracer cannot follow on its own. Pull those files into the standalone
  // output explicitly.
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**/*",
      "./node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/**/*",
      "./node_modules/.pnpm/prisma*/node_modules/prisma/**/*",
    ],
  },
  // Pin Turbopack to this project so a stray parent lockfile cannot misroute
  // module resolution (next-auth catch-all routes are sensitive to this).
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

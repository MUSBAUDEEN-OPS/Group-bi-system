import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@group-bi/kpi-lib"],
  // This app reads generated CSVs from the sibling data-generator/ package
  // at request time (fs.readFile with a dynamic path, in LocalFileSource) —
  // Next's tracer can't follow that automatically, so it must be told
  // explicitly which extra files to bundle into the serverless function,
  // and where the true monorepo root is so ../ paths resolve correctly.
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/**": ["../data-generator/output/summary/**", "../data-generator/output/reference/**"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import { execSync } from "child_process";
import pkg from "./package.json";

const gitHash = (() => {
  try { return execSync("git rev-parse --short HEAD").toString().trim() }
  catch { return "unknown" }
})()

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_HASH: gitHash,
  },
};

export default nextConfig;

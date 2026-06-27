import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 は Turbopack がデフォルト。WASM は Turbopack がネイティブサポート。
  turbopack: {},
};

export default nextConfig;

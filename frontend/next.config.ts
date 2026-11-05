import type { NextConfig } from "next";
const backend = (process.env.BACKEND_URL || "http://localhost:4000").replace(
  /\/$/,
  "",
);
const config: NextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};
export default config;

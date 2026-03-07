import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-edad5806cdff45b08f50aa762e6fce6c.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

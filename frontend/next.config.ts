import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: `${process.env.NEXT_PUBLIC_TRANSCRIBE_API_BASE}/:path*`,
          },
        ];
      },
};

export default nextConfig;

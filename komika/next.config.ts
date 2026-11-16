import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Izinkan akses dev (HMR) via 127.0.0.1 dan IP LAN agar WebSocket hot-reload tidak diblokir.
  allowedDevOrigins: ["127.0.0.1", "192.168.1.10", "localhost"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

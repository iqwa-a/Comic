import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // better-sqlite3 adalah modul native — jangan dibundel Turbopack.
  serverExternalPackages: ["better-sqlite3"],
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

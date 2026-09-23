import withPWAInit from "next-pwa";
import path from "node:path";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default withPWA({
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(),
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
});

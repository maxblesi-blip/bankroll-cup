/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "**.twitch.tv",
      },
      {
        protocol: "https",
        hostname: "youtube.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BANKROLL_START: "500",
    NEXT_PUBLIC_BANKROLL_GOAL: "5000",
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
  serverExternalPackages: ["busboy"],
  output: "standalone",
};

module.exports = nextConfig;

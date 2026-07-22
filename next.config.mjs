/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // mammoth pulls in node-only deps; keep it external to the server bundle.
    serverComponentsExternalPackages: ["mammoth"],
  },
};

export default nextConfig;

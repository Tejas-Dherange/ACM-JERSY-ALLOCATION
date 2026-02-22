/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Prisma must NOT be bundled by webpack — it relies on native .node binaries
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  // Proxy /api/backend/* → backend server
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `http://127.0.0.1:4000/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

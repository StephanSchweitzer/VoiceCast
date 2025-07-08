/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone build for Docker - this creates an optimized production build
  // that includes only the necessary dependencies and creates a server.js file
  output: 'standalone',

  // Add any existing configuration you might have here
  // For example:
  // images: {
  //   domains: ['example.com'],
  // },
  // experimental: {
  //   serverActions: true,
  // },
}

module.exports = nextConfig
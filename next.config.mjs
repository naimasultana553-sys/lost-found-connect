/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sharp is used directly by the matching module for perceptual hashing.
  // Keep Node.js runtime for all routes so file system + sharp work.
  reactStrictMode: true,
};

export default nextConfig;

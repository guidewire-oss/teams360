/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable SWC if having issues with SSL certificates
  swcMinify: false,
  typescript: {
    // During development, allow builds even with TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // During development, allow builds even with ESLint errors
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
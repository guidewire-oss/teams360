/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated swcMinify option
  experimental: {
    // Disable SWC transforms to use Babel instead on problematic systems
    forceSwcTransforms: false,
  },
}

module.exports = nextConfig
import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/docs'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for development
  swcMinify: true,

  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

export default withNextra(nextConfig)

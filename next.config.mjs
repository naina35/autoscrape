/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // This might be necessary for build-time variables
  },
  // Ensure environment variables are available at runtime
  serverRuntimeConfig: {
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
  },
  publicRuntimeConfig: {
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
}

module.exports = nextConfig
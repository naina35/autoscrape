// next.config.js
module.exports = {
  // Required for Puppeteer in Serverless Functions
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Avoid bundling Puppeteer for client-side (it's server-only)
      config.resolve.alias = {
        ...config.resolve.alias,
        "puppeteer-core": false,
        "@sparticuz/chromium": false,
      };
    }
    return config;
  },
  // Optional: If using App Router + Server Components
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
  },
};
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better serverless compatibility
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium']
  },

  // Webpack configuration to handle Puppeteer dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude puppeteer from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
        'puppeteer-core': 'commonjs puppeteer-core',
        '@sparticuz/chromium': 'commonjs @sparticuz/chromium'
      });
    }

    // Handle binary files and native modules
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Ignore specific warnings related to Puppeteer
    config.ignoreWarnings = [
      { module: /puppeteer/ },
      { module: /@sparticuz\/chromium/ },
    ];

    return config;
  },

  // Output configuration for better serverless deployment
  output: 'standalone',

  // Enable minification for better performance
  swcMinify: true,

  // Disable static optimization for API routes that use Puppeteer
  generateStaticParams: false,

  // Environment variables configuration (optional)
  env: {
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
    PUPPETEER_EXECUTABLE_PATH: '', // Will be set by @sparticuz/chromium
  },
}

export default nextConfig;
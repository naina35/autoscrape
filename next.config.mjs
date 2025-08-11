/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.js\.map$/,
      type: 'asset/source', // Treat as raw text so it doesn't break
    });
    return config;
  },
  productionBrowserSourceMaps: false, // ✅ correct way to disable in production
};

export default nextConfig;

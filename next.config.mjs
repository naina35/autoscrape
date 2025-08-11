/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.js\.map$/,
      type: 'asset/source', // Treat as raw text so it doesn't break
    });
    return config;
  },
  productionSourceMaps: false, // Disable sourcemaps in production
};

export default nextConfig;

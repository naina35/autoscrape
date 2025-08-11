/** @type {import('next').NextConfig} */
const nextConfig = {};
// next.config.js
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.js\.map$/,
      loader: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;

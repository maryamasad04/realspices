/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    qualities: [90]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = {
        ...config.externals,
        pg: 'commonjs pg',
        'pg-connection-string': 'commonjs pg-connection-string',
        'pg-pool': 'commonjs pg-pool',
      };
    }
    return config;
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize packages that use dynamic requires or native modules
      config.externals.push({
        'lzma': 'commonjs lzma',
        'steam-user': 'commonjs steam-user',
        'steamcommunity': 'commonjs steamcommunity',
        'steam-totp': 'commonjs steam-totp'
      });
    }
    return config;
  },
}

export default nextConfig
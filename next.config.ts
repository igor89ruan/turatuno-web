const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // temporário para descobrir o erro real
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
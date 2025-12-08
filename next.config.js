/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      "furssati.io",
      "furssati.com",
      "i0.wp.com",
      "secure.gravatar.com"
    ]
  },

  // rewrites & redirects إن احتجتها
  async redirects() {
    return [
      {
        source: '/old-product/:slug',
        destination: '/products/:slug',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/product/:path*',
        destination: '/api/products/:path*',
      },
    ];
  },
};

export default nextConfig;

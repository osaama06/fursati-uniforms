/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // ⭐ Image Optimization - محسّن
  images: {
    domains: [
      'furssati.io',
      'fursatiuniforms.com',
      'i0.wp.com',
      'secure.gravatar.com',
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'], // ⭐ تحسين: دعم WebP و AVIF
    minimumCacheTTL: 31536000, // ⭐ Cache لمدة سنة
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ⭐ Performance Optimizations
  compress: true, // Gzip compression
  poweredByHeader: false, // إخفاء X-Powered-By header

  // ⭐ Experimental Features للأداء
  experimental: {
    optimizeCss: true, // تحسين CSS
    optimizePackageImports: ['react-icons', 'react-hot-toast'], // تحسين imports
  },

  // ⭐ Headers للـ Caching والأداء
  async headers() {
    return [
      // Cache للصور
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache لـ static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // DNS Prefetch
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },

  // Redirects - من الكود القديم
  async redirects() {
    return [
      {
        source: '/old-product/:slug',
        destination: '/products/:slug',
        permanent: true,
      },
    ];
  },

  // Rewrites - من الكود القديم
  async rewrites() {
    return [
      {
        source: '/api/product/:path*',
        destination: '/api/products/:path*',
      },
    ];
  },

  // ⭐ Webpack Configuration للتحسين
  webpack: (config, { dev, isServer }) => {
    // تحسين Bundle Size في Production فقط
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework chunk (React)
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Commons chunk للكود المشترك
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          // Separate chunk للمكتبات الكبيرة
          lib: {
            test(module) {
              return (
                module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier())
              );
            },
            name(module) {
              const packageNameMatch = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              );
              const packageName = packageNameMatch
                ? packageNameMatch[1]
                : '';
              return `lib.${packageName.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
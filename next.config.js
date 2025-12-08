/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'localhost',
      // Add your image hosting domains here
      // 'example.com',
    ],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance Optimization
  swcMinify: true,
  productionBrowserSourceMaps: false,
  compress: true,

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' blob: data:",
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [];
  },

  // Rewrites
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // Environment Variables
  env: {
    // Add your environment variables here
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.optimization.minimize = true;
    return config;
  },

  // Internationalization (if needed, uncomment)
  // i18n: {
  //   locales: ['en', 'es', 'fr'],
  //   defaultLocale: 'en',
  // },

  // Experimental features
  experimental: {
    // Enable optimized font loading
    optimizeFonts: true,
    // Enable optimized package imports
    optimizePackageImports: [
      'lodash-es',
      'date-fns',
    ],
  },

  // Strict mode for development
  reactStrictMode: true,

  // Configure powered by header
  poweredByHeader: false,

  // Custom trailing slash behavior
  trailingSlash: false,

  // Configure default locale
  defaultLocale: 'en',

  // ESLint during build
  eslint: {
    dirs: ['pages', 'utils', 'components', 'lib'],
  },

  // TypeScript
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

module.exports = nextConfig;

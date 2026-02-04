// app/robots.js
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/cart',
          '/checkout',
          '/account',
          '/orders',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/cart',
          '/checkout',
          '/account',
        ],
      },
    ],
    sitemap: 'https://fursatiuniforms.com/sitemap.xml',
    host: 'https://fursatiuniforms.com',
  };
}
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
        ],
      },
    ],
    sitemap: 'https://fursatiuniforms/sitemap.xml',
    host: 'https://fursatiuniforms.com',
  };
}
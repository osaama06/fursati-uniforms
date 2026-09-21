// app/robots.js

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/cart",
        "/checkout",
        "/account",
        "/orders",
      ],
    },

    sitemap: "https://www.fursatiuniforms.com/sitemap.xml",
    host: "https://www.fursatiuniforms.com",
  };
}




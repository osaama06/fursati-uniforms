// utils/schema.js

// ========================================
// CONSTANTS
// ========================================
const SITE_URL = "https://fursatiuniforms.com";
const ORG_ID = `${SITE_URL}/#organization`;

// دالة لتنظيف HTML tags
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

// ========================================
// 1. Product Schema
// ========================================
export function generateProductSchema(product) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images?.map((img) => img.src) || [],
    description: stripHtml(
      product.short_description || product.description
    ),
    sku: product.sku || undefined,

    // ربط المنتج بنفس كيان المنظمة
    brand: {
      "@id": ORG_ID,
    },

    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "SAR",
      price: parseFloat(product.price),
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      )
        .toISOString()
        .split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock_status === "instock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",

      seller: {
        "@id": ORG_ID,
      },
    },
  };

  // التقييمات
  if (product.average_rating && product.rating_count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: parseFloat(product.average_rating),
      reviewCount: parseInt(product.rating_count),
      bestRating: "5",
      worstRating: "1",
    };
  }

  // الفئات
  if (product.categories?.length > 0) {
    schema.category = product.categories.map((c) => c.name).join(", ");
  }

  return schema;
}

// ========================================
// 2. Breadcrumb Schema
// ========================================
export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateProductBreadcrumb(product) {
  const items = [
    { name: "الرئيسية", url: SITE_URL },
    { name: "المنتجات", url: `${SITE_URL}/products` },
  ];

  if (product.categories?.length > 0) {
    items.push({
      name: product.categories[0].name,
      url: `${SITE_URL}/category/${product.categories[0].slug}`,
    });
  }

  items.push({
    name: product.name,
    url: `${SITE_URL}/products/${product.slug}`,
  });

  return generateBreadcrumbSchema(items);
}

// ========================================
// 3. Category Schema
// ========================================
export function generateCategorySchema(category, products = []) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: stripHtml(category.description),
    url: `${SITE_URL}/category/${category.slug}`,
  };

  if (products.length > 0) {
    schema.mainEntity = {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          url: `${SITE_URL}/products/${product.slug}`,
          image: product.images?.[0]?.src,
          brand: { "@id": ORG_ID },
          offers: {
            "@type": "Offer",
            price: parseFloat(product.price),
            priceCurrency: "SAR",
            availability:
              product.stock_status === "instock"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        },
      })),
    };
  }

  return schema;
}

export function generateCategoryBreadcrumb(category) {
  return generateBreadcrumbSchema([
    { name: "الرئيسية", url: SITE_URL },
    { name: "المنتجات", url: `${SITE_URL}/products` },
    {
      name: category.name,
      url: `${SITE_URL}/category/${category.slug}`,
    },
  ]);
}

// ========================================
// 4. Organization Schema (🔥 الأهم)
// ========================================
export function generateOrganizationSchema(config = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,

    // الاسم الأساسي عربي
    name: "فرصتي",

    // الاسم الإنجليزي كمرادف رسمي
    alternateName: "Fursati",

    url: SITE_URL,
    logo: config.logo || `${SITE_URL}/logo.png`,
    description:
      config.description ||
      "فرصتي متجر سعودي متخصص في الزي الموحد الطبي والمدرسي والمهني والتطريز",

    contactPoint: {
      "@type": "ContactPoint",
      telephone: config.phone || "+966-533-812-602",
      contactType: "Customer Service",
      areaServed: "SA",
      availableLanguage: ["Arabic", "English"],
    },

    sameAs: config.socialLinks || [
      "https://twitter.com/fursati",
      "https://instagram.com/fursati",
      "https://facebook.com/fursati",
    ],
  };
}

// ========================================
// 5. Website Schema
// ========================================
export function generateWebsiteSchema(config = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "فرصتي",
    alternateName: "Fursati",
    url: SITE_URL,
    inLanguage: "ar-SA",

    publisher: {
      "@id": ORG_ID,
    },

    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ========================================
// 6. FAQ Schema
// ========================================
export function generateFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(faq.answer),
      },
    })),
  };
}

// ========================================
// 7. Article Schema (FIXED)
// ========================================
export function generateArticleSchema(article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: stripHtml(article.excerpt || article.description),
    image: article.image || article.featured_image,
    datePublished: article.date || article.published_at,
    dateModified: article.modified || article.updated_at,

    author: {
      "@type": "Organization",
      name: "فرصتي",
      "@id": ORG_ID,
    },

    publisher: {
      "@id": ORG_ID,
    },

    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`,
    },
  };
}

// ========================================
// Helpers
// ========================================
export function renderSchema(schema) {
  return {
    __html: JSON.stringify(schema),
  };
}

export function combineSchemas(...schemas) {
  return schemas.filter(Boolean);
}

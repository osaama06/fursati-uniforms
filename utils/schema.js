// utils/schema.js

// دالة لتنظيف HTML tags
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// ========================================
// 1. Product Schema - للمنتجات
// ========================================
export function generateProductSchema(product) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map(img => img.src) || [],
    "description": stripHtml(product.short_description || product.description),
    "sku": product.sku || undefined,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Fursati"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://fursatiuniforms.com/products/${product.slug}`,
      "priceCurrency": "SAR",
      "price": parseFloat(product.price),
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock_status === 'instock' 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Fursati",
        "url": "https://fursatiuniforms.com"
      }
    }
  };
  
  // إضافة التقييمات إذا موجودة
  if (product.average_rating && product.rating_count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": parseFloat(product.average_rating),
      "reviewCount": parseInt(product.rating_count),
      "bestRating": "5",
      "worstRating": "1"
    };
  }
  
  // إضافة الفئات
  if (product.categories && product.categories.length > 0) {
    schema.category = product.categories.map(cat => cat.name).join(', ');
  }
  
  return schema;
}

// ========================================
// 2. Breadcrumb Schema - للتنقل
// ========================================
export function generateBreadcrumbSchema(items) {
  // items = [{ name: 'الرئيسية', url: '/' }, { name: 'المنتجات', url: '/products' }]
  
  return {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// Helper للمنتجات - يبني الـ Breadcrumb تلقائياً
export function generateProductBreadcrumb(product) {
  const items = [
    { name: "الرئيسية", url: "https://fursatiuniforms.com" },
    { name: "المنتجات", url: "https://fursatiuniforms.com/products" }
  ];
  
  // إضافة الفئة إذا موجودة
  if (product.categories && product.categories.length > 0) {
    items.push({
      name: product.categories[0].name,
      url: `https://fursatiuniforms.com/category/${product.categories[0].slug}`
    });
  }
  
  // إضافة المنتج
  items.push({
    name: product.name,
    url: `https://fursatiuniforms.com/products/${product.slug}`
  });
  
  return generateBreadcrumbSchema(items);
}

// ========================================
// 3. Category/CollectionPage Schema - للفئات
// ========================================
export function generateCategorySchema(category, products = []) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "CollectionPage",
    "name": category.name,
    "description": stripHtml(category.description),
    "url": `https://fursatiuniforms.com/category/${category.slug}`,
  };
  
  // إضافة المنتجات كـ ItemList
  if (products.length > 0) {
    schema.mainEntity = {
      "@type": "ItemList",
      "numberOfItems": products.length,
      "itemListElement": products.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "url": `https://fursatiuniforms.com/products/${product.slug}`,
          "image": product.images?.[0]?.src,
          "offers": {
            "@type": "Offer",
            "price": parseFloat(product.price),
            "priceCurrency": "SAR",
            "availability": product.stock_status === 'instock' 
              ? "https://schema.org/InStock" 
              : "https://schema.org/OutOfStock"
          }
        }
      }))
    };
  }
  
  return schema;
}

// Helper للفئات - يبني الـ Breadcrumb تلقائياً
export function generateCategoryBreadcrumb(category) {
  return generateBreadcrumbSchema([
    { name: "الرئيسية", url: "https://fursatiuniforms.com" },
    { name: "المنتجات", url: "https://fursatiuniforms.com/products" },
    { name: category.name, url: `https://fursatiuniforms.com/category/${category.slug}` }
  ]);
}

// ========================================
// 4. Organization Schema - للموقع (Homepage)
// ========================================
export function generateOrganizationSchema(config = {}) {
  return {
    "@context": "https://schema.org/",
    "@type": "Organization",
    "name": config.name || "Fursati",
    "url": config.url || "https://fursatiuniforms.com",
    "logo": config.logo || "https://fursati.io/logo.png",
    "description": config.description || "متجر إلكتروني متخصص في بيع المنتجات عالية الجودة",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": config.phone || "+966-533-812-602",
      "contactType": "Customer Service",
      "areaServed": "SA",
      "availableLanguage": ["Arabic", "English"]
    },
    "sameAs": config.socialLinks || [
      "https://twitter.com/fursati",
      "https://instagram.com/fursati",
      "https://facebook.com/fursati"
    ]
  };
}

// ========================================
// 5. WebSite Schema - للموقع (Homepage)
// ========================================
export function generateWebsiteSchema(config = {}) {
  return {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    "name": config.name || "Fursati",
    "url": config.url || "https://fursatiuniforms.com",
    "description": config.description || "متجر فرصتي للزي الموحد ",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${config.url || "https://fursatiuniforms.com"}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "ar-SA"
  };
}

// ========================================
// 6. FAQ Schema - للأسئلة الشائعة
// ========================================
export function generateFAQSchema(faqs) {
  // faqs = [{ question: 'السؤال؟', answer: 'الجواب' }]
  
  return {
    "@context": "https://schema.org/",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": stripHtml(faq.answer)
      }
    }))
  };
}

// ========================================
// 7. Article/BlogPosting Schema - للمقالات
// ========================================
export function generateArticleSchema(article) {
  return {
    "@context": "https://schema.org/",
    "@type": "Article",
    "headline": article.title,
    "description": stripHtml(article.excerpt || article.description),
    "image": article.image || article.featured_image,
    "datePublished": article.date || article.published_at,
    "dateModified": article.modified || article.updated_at,
    "author": {
      "@type": "Person",
      "name": article.author?.name || "Fursati Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fursati",
      "logo": {
        "@type": "ImageObject",
        "url": "https://fursatiuniforms.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url || `https://fursatiuniforms.com/blog/${article.slug}`
    }
  };
}

// ========================================
// 8. Local Business Schema - للأعمال المحلية
// ========================================
export function generateLocalBusinessSchema(config = {}) {
  return {
    "@context": "https://schema.org/",
    "@type": "LocalBusiness",
    "name": config.name || "Fursati",
    "image": config.image || "https://fursatiuniforms.com/logo.png",
    "url": config.url || "https://fursatiuniforms.com",
    "telephone": config.phone || "+966-533-8",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": config.street || "شارع  الشيخ فيصل",
      "addressLocality": config.city || "سكاكا",
      "addressRegion": config.region || "الجوف",
      "addressCountry": "SA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": config.latitude || 24.7136,
      "longitude": config.longitude || 46.6753
    },
    "openingHoursSpecification": config.openingHours || [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ]
  };
}

// ========================================
// 9. Helper - تنسيق Schema للاستخدام
// ========================================
export function renderSchema(schema) {
  return {
    __html: JSON.stringify(schema)
  };
}

// ========================================
// 10. Helper - دمج عدة Schemas
// ========================================
export function combineSchemas(...schemas) {
  return schemas.filter(Boolean); // يزيل null/undefined
}
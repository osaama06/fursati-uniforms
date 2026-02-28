import ProductCard from "@/app/productCard/page";
import { notFound } from "next/navigation";
import "@/styles/components/products-grid.css";

import { 
  generateCategorySchema, 
  generateCategoryBreadcrumb,
  renderSchema 
} from '@/utils/schema';

// ================================
// CONSTANTS (Static Config)
// ================================
const SITE_URL = "https://fursatiuniforms.com";
const SITE_NAME = " فرصتي";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.webp`;

// ================================
// Data Fetching
// ================================
async function getCategoryBySlug(slug) {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products/categories?slug=${slug}`,
    {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return null;
  const categories = await res.json();
  return categories.length > 0 ? categories[0] : null;
}

async function getProductsByCategoryId(id) {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products?category=${id}&per_page=50&status=publish`,
    {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return [];
  return await res.json();
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

// ================================
// GENERATE METADATA (Hybrid Approach)
// ================================
export async function generateMetadata({ params }) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    return {
      title: "فئة غير موجودة | فرصتي",
      robots: { index: false, follow: true }
    };
  }

  // 1. Dynamic Content from CMS (WooCommerce/Yoast)
  // نفضل بيانات Yoast إذا وجدت، وإلا نستخدم بيانات الفئة الافتراضية
  const seo = category.yoast_seo || {};
  
  const rawTitle = seo.title || category.name;
  const rawDesc = stripHtml(seo.metaDesc || category.description || `تسوق أفضل منتجات ${category.name} من متجر فرصتي.`);
  
  // تنظيف العنوان: إذا لم يحتوي على اسم الموقع، نضيفه
  const title = rawTitle.includes("فرصتي") || rawTitle.includes("Fursati") 
    ? rawTitle 
    : `${rawTitle} | فرصتي`;

  // تحديد الصورة: صورة الفئة > صورة Yoast > الصورة الافتراضية
  const categoryImage = category.image?.src || seo.opengraphImage || DEFAULT_OG_IMAGE;

  // 2. Construct Frontend URL manually (To avoid backend domain leaking)
  const pageUrl = `/category/${category.slug}`;

  return {
    metadataBase: new URL(SITE_URL),
    
    title: title,
    description: rawDesc,
    keywords: seo.focuskw || `${category.name}, زي موحد, فرصتي, ملابس ${category.name}`,
    
    alternates: {
      canonical: pageUrl, // https://fursatiuniforms.com/category-slug
    },

    openGraph: {
      title: title,
      description: rawDesc,
      url: pageUrl,
      siteName: "فرصتي",
       alternateName: ["Fursati", "Fursati Uniforms"],
      locale: "ar_SA",     // Static
      type: "website",     // Static
      images: [
        {
          url: categoryImage,
          width: 800,
          height: 600,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image", // Static
      title: title,
      description: rawDesc,
      images: [categoryImage],
    },

    robots: {
      index: seo.metaRobotsNoindex !== 'noindex', // Dynamic logic
      follow: seo.metaRobotsNofollow !== 'nofollow', // Dynamic logic
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ================================
// PAGE COMPONENT
// ================================
export default async function CategoryPage({ params }) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) notFound();

  const products = await getProductsByCategoryId(category.id);

  // Schemas
  // نمرر الروابط الصحيحة (Frontend URL) لدوال السكيما
  const frontendUrl = `${SITE_URL}/category/${category.slug}`;
  const categorySchema = generateCategorySchema({ ...category, permalink: frontendUrl }, products);
  const breadcrumbSchema = generateCategoryBreadcrumb({ ...category, permalink: frontendUrl });

  return (
    <>
      {/* Category Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(categorySchema)}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(breadcrumbSchema)}
      />

      <main className="products-page">
        <header className="category-header">
          <h1 className="category-title">
             {category.name}</h1>

          {/* {category.description && (
            <div
              className="category-description"
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          )} */}

          <div className="category-meta">
            <span className="products-count">{products.length} منتج</span>
          </div>
        </header>

        <section className="products-grid-container" aria-label={`قائمة منتجات ${category.name}`}>
          {products.length === 0 ? (
            <div className="no-products">
              <p>لا توجد منتجات متاحة حالياً في هذه الفئة.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div className="product-wrapper" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
import ProductCard from "@/app/_productCard/page";
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
const SITE_URL = "https://www.fursatiuniforms.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.webp`;

// ✅ مسار التصنيف الفعلي في الموقع (على الجذر مباشرة: /scrubs)
// لو غيرت مكان الـ route مستقبلاً، غيّر هذا السطر بس
const categoryPath = (slug) => `/${slug}`;

// ================================
// Data Fetching
// ================================
async function getCategoryBySlug(slug) {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(
    `https://fursatiuniforms.store/wp-json/wc/v3/products/categories?slug=${slug}`,
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
    `https://fursatiuniforms.store/wp-json/wc/v3/products?category=${id}&per_page=50&status=publish`,
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
// GENERATE METADATA
// ================================
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: { absolute: "الصفحة غير موجودة | فرصتي" },
      robots: { index: false, follow: true }
    };
  }

  const seo = category.yoast_seo || {};

  const rawTitle = seo.title || category.name;
  const rawDesc = stripHtml(seo.metaDesc || category.description || `تسوق أفضل منتجات ${category.name} من متجر فرصتي.`);

  // ✅ نبني العنوان يدوياً ونستخدم absolute لمنع layout من إضافة | فرصتي مرة ثانية
  const title = rawTitle.includes("فرصتي") || rawTitle.includes("Fursati")
    ? rawTitle
    : `${rawTitle} | فرصتي`;

  const categoryImage = category.image?.src || seo.opengraphImage || DEFAULT_OG_IMAGE;

  // ✅ الـ canonical يأشر على الصفحة نفسها، مو على /category/ اللي ترجع 404
  const pageUrl = categoryPath(category.slug);

  // ✅ تصنيف فاضي (زي public أو تصنيف تجريبي) ما ينفهرس
  const isIndexable = category.count > 0;

  return {
    metadataBase: new URL(SITE_URL),

    title: { absolute: title },

    description: rawDesc,
    keywords: seo.focuskw || `${category.name}, زي موحد, فرصتي, ملابس ${category.name}`,

    alternates: {
      canonical: pageUrl,
    },

    openGraph: {
      title,
      description: rawDesc,
      url: pageUrl,
      siteName: "فرصتي",
      alternateName: ["Fursati", "Fursati Uniforms"],
      locale: "ar_SA",
      type: "website",
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
      card: "summary_large_image",
      title,
      description: rawDesc,
      images: [categoryImage],
    },

    robots: {
      index: isIndexable,
      follow: true,
      googleBot: {
        index: isIndexable,
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
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const products = await getProductsByCategoryId(category.id);

  // ✅ نفس المسار في الـ schema عشان ما يتعارض مع الـ canonical
  const frontendUrl = `${SITE_URL}${categoryPath(category.slug)}`;
  const categorySchema = generateCategorySchema({ ...category, permalink: frontendUrl }, products);
  const breadcrumbSchema = generateCategoryBreadcrumb({ ...category, permalink: frontendUrl });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(categorySchema)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(breadcrumbSchema)}
      />

      <main className="products-page">
        <header className="category-header">
          <h1 className="category-title">{category.name}</h1>

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
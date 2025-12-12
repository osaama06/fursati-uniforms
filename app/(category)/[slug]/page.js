//app/category/[slug]/page.js
import ProductCard from "@/app/productCard/page";
import { notFound } from "next/navigation";
import "@/styles/components/products-grid.css";

import { 
  generateCategorySchema, 
  generateCategoryBreadcrumb,
  renderSchema 
} from '@/utils/schema';

import { fixYoastUrls } from "@/utils/seoCleaner";

// ================================
// جلب الكاتيجوري
// ================================
async function getCategoryBySlug(slug) {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(
    "https://furssati.io/wp-json/wc/v3/products/categories",
    {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    }
  );

  const categories = await res.json();
  return categories.find((cat) => cat.slug === slug);
}

// ================================
// جلب المنتجات حسب الكاتيجوري
// ================================
async function getProductsByCategoryId(id) {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products?category=${id}&per_page=50`,
    {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    }
  );

  return await res.json();
}

// ================================
// حذف HTML من النص
// ================================
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

// ================================
// GENERATE METADATA
// ================================
export async function generateMetadata({ params }) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    return {
      title: "فئة غير موجودة",
    };
  }

  const seo = category.yoast_seo;

  // ما فيه Yoast → نحط شيء يدوي
  if (!seo) {
    return {
      title: `${category.name} - Fursati`,
      description:
        stripHtml(category.description) || `تسوق منتجات ${category.name}`,
    };
  }

  return {
    title: fixYoastUrls(seo.title || `${category.name} - Fursati`),

    description: fixYoastUrls(
      stripHtml(seo.metaDesc) ||
        stripHtml(category.description) ||
        `تسوق منتجات ${category.name}`
    ),

    alternates: {
      canonical: fixYoastUrls(
        seo.canonical ||
          `https://fursatiuniforms.com/category/${category.slug}`
      ),
    },

    openGraph: {
      title: fixYoastUrls(seo.opengraphTitle || seo.title || category.name),

      description: fixYoastUrls(
        stripHtml(seo.opengraphDescription) ||
          stripHtml(seo.metaDesc) ||
          stripHtml(category.description)
      ),

      images: seo.opengraphImage
        ? [fixYoastUrls(seo.opengraphImage)]
        : category.image?.src
        ? [fixYoastUrls(category.image.src)]
        : [],

      url: fixYoastUrls(
        seo.canonical ||
          `https://fursatiuniforms.com/category/${category.slug}`
      ),

      siteName: "Fursati",
      locale: "ar_SA",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: fixYoastUrls(seo.twitterTitle || seo.title || category.name),
      description: fixYoastUrls(
        stripHtml(seo.twitterDescription) ||
          stripHtml(seo.metaDesc) ||
          stripHtml(category.description)
      ),
      images: seo.twitterImage
        ? [fixYoastUrls(seo.twitterImage)]
        : category.image?.src
        ? [fixYoastUrls(category.image.src)]
        : [],
    },
  };
}

// ================================
// PAGE
// ================================
export default async function CategoryPage({ params }) {
  const category = await getCategoryBySlug(params.slug);

  if (!category) notFound();

  const products = await getProductsByCategoryId(category.id);

  // Schemas
  const categorySchema = generateCategorySchema(category, products);
  const breadcrumbSchema = generateCategoryBreadcrumb(category);

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
        <div className="category-header">
          <h1>منتجات {category.name}</h1>

          {category.description && (
            <div
              className="category-description"
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          )}

          <p className="products-count">{products.length} منتج</p>
        </div>

        {products.length === 0 ? (
          <p className="no-products">لا توجد منتجات في هذه الفئة</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div className="product-wrapper" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

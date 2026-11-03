import ProductContent from "./ProductContent";
import { notFound } from "next/navigation";
import {
  generateProductSchema,
  generateProductBreadcrumb,
  renderSchema,
} from "@/utils/schema";

// ================================
// ISR
// ================================
// الصفحة تنبني أول مرة يزورها أحد، وتتخزن، وتتحدث كل ساعة
export const revalidate = 3600;

// مصفوفة فاضية = لا نبني المنتجات وقت الـ build (عشان ما نضغط الباك إند)
// لكن نفعّل الكاش لكل منتج من أول زيارة
export async function generateStaticParams() {
  return [];
}

// ================================
// CONSTANTS (Static Config)
// ================================
const SITE_URL = "https://www.fursatiuniforms.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.webp`;
const WP_BASE = (
  process.env.WOO_URL || "https://fursatiuniforms.store"
).replace(/\/$/, "");

function authHeader() {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");
  return { Authorization: `Basic ${auth}` };
}

// ================================
// Fetch مع مهلة ومحاولة ثانية
// ================================
// ⚠ لو فشل الاتصال نرمي خطأ — ما نرجع null.
// السبب: null يعني notFound()، و Next يخزّن الـ 404 ساعة كاملة،
// فـ Google يشوف المنتج محذوف بسبب عطل مؤقت.
// مع الخطأ: Next يبقي النسخة القديمة من الصفحة في الكاش.
async function wooFetch(url) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: authHeader(),
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${url}`);
      }

      return await res.json();
    } catch (error) {
      lastError = error;
      console.error(
        `Product fetch failed (attempt ${attempt}):`,
        error?.cause?.code || error?.message
      );
    }
  }

  throw lastError;
}

// ================================
// Data Fetching
// ================================
async function getProductBySlug(slug) {
  const data = await wooFetch(
    `${WP_BASE}/wp-json/wc/v3/products?slug=${encodeURIComponent(slug)}`
  );

  // هنا فقط نرجع null — المنتج فعلاً غير موجود
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function getVariations(productId) {
  // per_page=100 — الافتراضي 10 فقط، فالمنتجات اللي فيها
  // مقاسات × ألوان أكثر من 10 كانت تنقص منها خيارات
  const data = await wooFetch(
    `${WP_BASE}/wp-json/wc/v3/products/${productId}/variations?per_page=100`
  );

  return Array.isArray(data) ? data : [];
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function safeDecode(slug) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

// ================================
// HELPERS FOR GOOGLE RICH RESULTS
// ================================
function getProductBrand(product) {
  const brandAttr = product.attributes?.find(
    (attr) =>
      attr.name?.toLowerCase() === "brand" || attr.name === "الماركة"
  );
  if (brandAttr && brandAttr.options && brandAttr.options.length > 0) {
    return brandAttr.options[0];
  }
  return "فرصتي";
}

// ================================
// GENERATE METADATA
// ================================
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(safeDecode(slug));

  if (!product) {
    return {
      title: { absolute: "المنتج غير موجود | فرصتي" },
      robots: { index: false, follow: true },
    };
  }

  const seo = product.yoast_seo || {};
  const rawTitle = seo.title || product.name;

  const rawDesc = stripHtml(
    seo.metaDesc ||
      product.short_description ||
      product.description ||
      `تسوق ${product.name} بأفضل الأسعار من متجر فرصتي.`
  );

  // نبني العنوان يدوياً ونستخدم absolute لمنع layout من إضافة | فرصتي مرة ثانية
  const title =
    rawTitle.includes("فرصتي") || rawTitle.includes("Fursati")
      ? rawTitle
      : `${rawTitle} | فرصتي`;

  const mainImage =
    seo.opengraphImage || product.images?.[0]?.src || DEFAULT_OG_IMAGE;

  const pageUrl = `/products/${product.slug}`;

  // تجاهل Yoast robots — WordPress مانع الأرشفة عمداً
  const index = true;
  const follow = true;

  const availability =
    product.stock_status === "instock" ? "in stock" : "out of stock";

  return {
    metadataBase: new URL(SITE_URL),

    title: { absolute: title },

    description: rawDesc,

    keywords: [
      product.name,
      "فرصتي",
      "Fursati",
      "زي طبي",
      "يونيفورم طبي",
      "سكراب طبي السعودية",
    ],

    alternates: {
      canonical: pageUrl,
    },

    openGraph: {
      title,
      description: rawDesc,
      url: pageUrl,
      siteName: "فرصتي",
      locale: "ar_SA",
      type: "website",
      images: [
        {
          url: mainImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description: rawDesc,
      images: [mainImage],
    },

    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    other: {
      "og:site_name": "فرصتي",
      "application-name": "فرصتي",
      "apple-mobile-web-app-title": "فرصتي",
      "product:price:amount": product.price,
      "product:price:currency": "SAR",
      "product:availability": availability,
      "product:brand": "فرصتي",
      "product:retailer_item_id": product.sku || String(product.id),
      "product:condition": "new",
    },
  };
}

// ================================
// PAGE COMPONENT
// ================================
export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(safeDecode(slug));

  if (!product) notFound();

  const variations =
    product.type === "variable" ? await getVariations(product.id) : [];

  const frontendUrl = `${SITE_URL}/products/${product.slug}`;

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const priceValidUntil = nextYear.toISOString().split("T")[0];

  const schemaAvailability =
    product.stock_status === "instock"
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const productForSchema = {
    ...product,
    permalink: frontendUrl,
    brand: getProductBrand(product),
    sku: product.sku || String(product.id),
    image: product.images?.map((img) => img.src) || [],
    description: stripHtml(product.short_description || product.description),
    offers: {
      price: product.price || 0,
      currency: "SAR",
      availability: schemaAvailability,
      priceValidUntil,
      url: frontendUrl,
    },
    average_rating: Number(product.average_rating) || 0,
    rating_count: Number(product.rating_count) || 0,
  };

  const productSchema = generateProductSchema(productForSchema);
  const breadcrumbSchema = generateProductBreadcrumb(productForSchema);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(productSchema)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(breadcrumbSchema)}
      />
      <ProductContent product={product} variations={variations} />
    </>
  );
}
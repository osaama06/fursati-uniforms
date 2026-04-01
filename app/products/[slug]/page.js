import ProductContent from "./ProductContent";
import { notFound } from "next/navigation";
import {
  generateProductSchema,
  generateProductBreadcrumb,
  renderSchema,
} from "@/utils/schema";

// ================================
// CONSTANTS (Static Config)
// ================================
const SITE_URL = "https://fursatiuniforms.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.webp`;

// ================================
// Data Fetching
// ================================
async function getProductBySlug(slug) {
  const consumerKey = process.env.WOO_CONSUMER_KEY;
  const secretKey = process.env.WOO_SECRET_KEY;
  const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString("base64");

  // ✅ decode the slug before fetching
  const decodedSlug = decodeURIComponent(slug);

  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products?slug=${decodedSlug}`,
    {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

async function getVariations(productId) {
  const consumerKey = process.env.WOO_CONSUMER_KEY;
  const secretKey = process.env.WOO_SECRET_KEY;
  const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString("base64");

  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products/${productId}/variations`,
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
// HELPERS FOR GOOGLE RICH RESULTS
// ================================
function getProductBrand(product) {
  const brandAttr = product.attributes?.find(
    (attr) => attr.name.toLowerCase() === "brand" || attr.name === "الماركة"
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
  const decodedSlug = decodeURIComponent(slug); // ✅
  const product = await getProductBySlug(decodedSlug);

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

  // ✅ نبني العنوان يدوياً ونستخدم absolute لمنع layout من إضافة | فرصتي مرة ثانية
  const title =
    rawTitle.includes("فرصتي") || rawTitle.includes("Fursati")
      ? rawTitle
      : `${rawTitle} | فرصتي`;

  const mainImage =
    seo.opengraphImage ||
    product.images?.[0]?.src ||
    DEFAULT_OG_IMAGE;

  const pageUrl = `/products/${product.slug}`;

  // ✅ تجاهل Yoast robots — WordPress مانع الأرشفة عمداً
  const index = true;
  const follow = true;

  const condition = "new";
  const availability =
    product.stock_status === "instock" ? "in stock" : "out of stock";

  return {
    metadataBase: new URL(SITE_URL),

    // ✅ absolute يمنع layout template من إضافة | فرصتي مرة ثانية
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
      "product:condition": condition,
    },
  };
}

// ================================
// PAGE COMPONENT
// ================================
export default async function ProductPage({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug); // ✅
  const product = await getProductBySlug(decodedSlug);

  if (!product) notFound();

  const variations = await getVariations(product.id);

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
      priceValidUntil: priceValidUntil,
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
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
const SITE_NAME = "Fursati | فرصتي";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

// ================================
// Data Fetching
// ================================
async function getProductBySlug(slug) {
  const consumerKey = process.env.WOO_CONSUMER_KEY;
  const secretKey = process.env.WOO_SECRET_KEY;
  const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString("base64");

  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products?slug=${slug}`,
    {
      headers: { Authorization: `Basic ${auth}` },
      // Cache strategy: Revalidate every hour
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
      // Cache strategy: Revalidate every hour
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
  // Try to find brand in attributes
  const brandAttr = product.attributes?.find(
    (attr) => attr.name.toLowerCase() === "brand" || attr.name === "الماركة"
  );
  if (brandAttr && brandAttr.options && brandAttr.options.length > 0) {
    return brandAttr.options[0];
  }
  // Fallback to Site Name
  return "Fursati";
}

// ================================
// GENERATE METADATA (Hybrid Approach)
// ================================
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "المنتج غير موجود | فرصتي",
      robots: { index: false, follow: true }
    };
  }

  // 1. Dynamic Content from CMS (WooCommerce/Yoast)
  const seo = product.yoast_seo || {};

  const rawTitle = seo.title || product.name;
  const rawDesc = stripHtml(seo.metaDesc || product.short_description || product.description || `تسوق ${product.name} بأفضل الأسعار.`);

  // Clean Title
  const title = rawTitle.includes("فرصتي") || rawTitle.includes("Fursati")
    ? rawTitle
    : `${rawTitle} | فرصتي`;

  // Image Logic: Yoast Image > Product Image > Default
  const mainImage = seo.opengraphImage || product.images?.[0]?.src || DEFAULT_OG_IMAGE;

  // 2. Construct Frontend URL manually
  const pageUrl = `/products/${product.slug}`;

  // Robots Logic
  const index = seo.metaRobotsNoindex !== 'noindex';
  const follow = seo.metaRobotsNofollow !== 'nofollow';

  // Product Specific Data for Meta Tags
  const brand = getProductBrand(product);
  const condition = "new"; // Assuming new products
  const availability = product.stock_status === "instock" ? "in stock" : "out of stock";

  return {
    metadataBase: new URL(SITE_URL),

    title: title,
    description: rawDesc,

    alternates: {
      canonical: pageUrl,
    },

    openGraph: {
      title: title,
      description: rawDesc,
      url: pageUrl,
      siteName: "Fursati", // Static
      locale: "ar_SA",     // Static
      type: "website",     // Static
      images: [
        {
          url: mainImage,
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
      images: [mainImage],
    },

    robots: {
      index: index,
      follow: follow,
      googleBot: {
        index: index,
        follow: follow,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Rich Product Meta Tags (Crucial for Google Merchant Center/Shopping)
    other: {
      "product:price:amount": product.price,
      "product:price:currency": "SAR",
      "product:availability": availability,
      "product:brand": brand,
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
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const variations = await getVariations(product.id);

  // ==========================================
  // PREPARE DATA FOR SCHEMA (RICH RESULTS)
  // ==========================================
  // We explicitly format the data here to ensure the utils/schema function
  // receives exactly what Google needs for a "Product Card".

  const frontendUrl = `${SITE_URL}/products/${product.slug}`;

  // 1. Calculate Price Valid Until (Required by Google to show price)
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const priceValidUntil = nextYear.toISOString().split('T')[0];

  // 2. Map Availability to Schema.org URL
  const schemaAvailability = product.stock_status === 'instock'
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  // 3. Prepare Enhanced Object
  const productForSchema = {
    ...product,
    permalink: frontendUrl,
    // Ensure these fields are strictly formatted for the schema generator
    brand: getProductBrand(product),
    sku: product.sku || String(product.id),
    image: product.images?.map(img => img.src) || [],
    description: stripHtml(product.short_description || product.description),
    offers: {
      price: product.price || 0,
      currency: "SAR",
      availability: schemaAvailability,
      priceValidUntil: priceValidUntil,
      url: frontendUrl
    },
    // Pass numeric ratings if they exist (Critical for Star Ratings in Google)
    average_rating: Number(product.average_rating) || 0,
    rating_count: Number(product.rating_count) || 0
  };

  // Schemas
  const productSchema = generateProductSchema(productForSchema);
  const breadcrumbSchema = generateProductBreadcrumb(productForSchema);

  return (
    <>
      {/* Product Schema (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(productSchema)}
      />

      {/* Breadcrumb Schema (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(breadcrumbSchema)}
      />

      <ProductContent product={product} variations={variations} />
    </>
  );
}
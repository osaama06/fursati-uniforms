// app/products/[slug]/page.js
import ProductContent from "./ProductContent";
import { notFound } from "next/navigation";
import {
  generateProductSchema,
  generateProductBreadcrumb,
  renderSchema,
} from "@/utils/schema";

// 🔥 دالة استبدال دومين الووردبريس بدومين الفرونت
function replaceWPDomain(url) {
  if (!url) return url;
  return url.replace("https://furssati.io", "https://fursatiuniforms.com");
}

async function getProductBySlug(slug) {
  const consumerKey = process.env.WOO_CONSUMER_KEY;
  const secretKey = process.env.WOO_SECRET_KEY;
  const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString("base64");

  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products?slug=${slug}`,
    {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
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
      cache: "no-store",
    }
  );

  if (!res.ok) return [];
  return await res.json();
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

// ---------------------------
//    SEO + Yoast Fix
// ---------------------------
export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};

  const seo = product.yoast_seo || {};

  // Canonical
  const canonicalUrl = replaceWPDomain(
    seo.canonical ||
      `https://fursatiuniforms.com/products/${product.slug}`
  );

  // OG Images
  const ogImages = seo.opengraphImage
    ? [replaceWPDomain(seo.opengraphImage)]
    : product.images?.map((img) => replaceWPDomain(img.src));

  // Twitter image
  const twitterImage = seo.twitterImage
    ? replaceWPDomain(seo.twitterImage)
    : replaceWPDomain(product.images?.[0]?.src);

  return {
    title: seo.title || product.name,
    description: stripHtml(seo.metaDesc || product.short_description),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seo.opengraphTitle || seo.title || product.name,
      description: stripHtml(
        seo.opengraphDescription || seo.metaDesc
      ),
      images: ogImages,
      url: canonicalUrl,
      siteName: "Fursati",
      locale: "ar_SA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.twitterTitle || seo.title || product.name,
      description: stripHtml(seo.twitterDescription || seo.metaDesc),
      images: [twitterImage],
    },
    other: {
      "product:price:amount": product.price,
      "product:price:currency": "SAR",
      "product:availability":
        product.stock_status === "instock"
          ? "in stock"
          : "out of stock",
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProductBySlug(params.slug);

  if (!product) notFound();

  const variations = await getVariations(product.id);

  // Schemas
  const productSchema = generateProductSchema(product);
  const breadcrumbSchema = generateProductBreadcrumb(product);

  return (
    <>
      {/* Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(productSchema)}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(breadcrumbSchema)}
      />

      <ProductContent product={product} variations={variations} />
    </>
  );
}

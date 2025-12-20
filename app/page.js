// app/page.js
import BannerSlider from "./components/bannerslider/page";
import ProductSlider from "./components/ProductSlider/page";
import StoriesSlider from "./components/storiesSlider/page";

import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  renderSchema,
} from "@/utils/schema";

// =============================
// 🧠 Helper: Base Auth Header
// =============================
const getAuthHeader = () => {
  return Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");
};

// =============================
// 🧠 Fetch Categories
// =============================
async function getCategories() {
  try {
    const res = await fetch(
      "https://furssati.io/wp-json/wc/v3/products/categories?per_page=20",
      {
        headers: { Authorization: `Basic ${getAuthHeader()}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.filter((cat) => cat.count > 0 && cat.slug !== "uncategorized");
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// =============================
// 🧠 Fetch Products by Category
// =============================
async function getProductsByCategoryId(categoryId) {
  try {
    const res = await fetch(
      `https://furssati.io/wp-json/wc/v3/products?category=${categoryId}&status=publish&per_page=10`,
      {
        headers: { Authorization: `Basic ${getAuthHeader()}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

// =============================
// 🧠 Fetch Best Selling Products
// =============================
async function getBestSellingProducts() {
  try {
    const res = await fetch(
      `https://furssati.io/wp-json/wc/v3/products?orderby=popularity&order=desc&status=publish&per_page=10`,
      {
        headers: { Authorization: `Basic ${getAuthHeader()}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

// =============================
// ✅ Metadata (Homepage)
// =============================
export const metadata = {
  title: "فرصتي | تسوق جميع منتجات الزي الموحد",
  description:
    "متجر فرصتي للزي الموحد الطبي والمدرسي. سكراب طبي، مريول مدرسي، لابكوت، زي موحد بجودة عالية وأسعار منافسة مع توصيل لجميع مدن السعودية.",
  keywords:
    "زي مدرسي, سكراب طبي, مريول, لابكوت, زي موحد, فرصتي, ملابس طبية, ملابس مدرسية, زي موحد السعودية",
  openGraph: {
    title: "Fursati | متجر فرصتي للزي الموحد",
    description: "متجر فرصتي للزي الموحد الطبي والمدرسي بجودة عالية وأسعار منافسة.",
    url: "https://fursatiuniforms.com",
    siteName: "Fursati Uniforms",
    images: [{ url: "https://fursatiuniforms.com/og-image.jpg", width: 1200, height: 630 }],
    locale: "ar_SA",
    type: "website",
  },
  alternates: { canonical: "https://fursatiuniforms.com" },
  robots: { index: true, follow: true },
};

// =============================
// 🏠 Homepage Component
// =============================
export default async function Home() {
  // 1. Fetch Categories and Best Sellers in parallel
  const [categories, bestSellers] = await Promise.all([
    getCategories(),
    getBestSellingProducts(),
  ]);

  // 2. Fetch products for each category in parallel
  const sliders = await Promise.all(
    categories.map(async (category) => {
      const products = await getProductsByCategoryId(category.id);
      return { category, products };
    })
  );

  // =============================
  // 🧠 Schema Config
  // =============================
  const siteConfig = {
    name: "Fursati",
    alternateName: "فرصتي",
    url: "https://fursatiuniforms.com",
    logo: "https://fursatiuniforms.com/logo.png",
    image: "https://fursatiuniforms.com/logo.png",
    description: "متجر فرصتي للزي الموحد الطبي والمدرسي في السعودية.",
    socialLinks: [
      "https://twitter.com/fursatiuniforms",
      "https://instagram.com/fursatiuniforms",
      "https://tiktok.com/@fursatiuniforms",
    ],
  };

  const organizationSchema = generateOrganizationSchema(siteConfig);
  const websiteSchema = generateWebsiteSchema(siteConfig);

  return (
    <>
      {/* ✅ SEO Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(organizationSchema)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(websiteSchema)}
      />

      <main>
        {/* 1. Hero Section */}
        <BannerSlider />
        
        {/* 2. Stories Section */}
        <StoriesSlider />

        {/* 3. Best Sellers Section (Featured First) */}
        {bestSellers.length > 0 && (
          <ProductSlider
            category={{ name: "الأكثر مبيعاً ✨", id: "best-sellers" }}
            products={bestSellers}
          />
        )}

        {/* 4. Dynamic Category Sections */}
        {sliders.map(({ category, products }) =>
          products.length > 0 ? (
            <ProductSlider
              key={category.id}
              category={category}
              products={products}
            />
          ) : null
        )}
      </main>
    </>
  );
}
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
// 🧠 Fetch Categories
// =============================
async function getCategories() {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(
    "https://furssati.io/wp-json/wc/v3/products/categories",
    {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 3600 },
    }
  );

  const data = await res.json();
  return data.filter((cat) => cat.count > 0);
}

// =============================
// 🧠 Fetch Products by Category
// =============================
async function getProductsByCategoryId(id) {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products?category=${id}&per_page=10`,
    {
      headers: { Authorization: `Basic ${auth}` },
      next: { revalidate: 3600 },
    }
  );

  return await res.json();
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
    description:
      "متجر فرصتي للزي الموحد الطبي والمدرسي بجودة عالية وأسعار منافسة.",
    url: "https://fursatiuniforms.com",
    siteName: "Fursati Uniforms",
    images: [
      {
        url: "https://fursatiuniforms.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fursati - متجر فرصتي للزي الموحد",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Fursati | متجر فرصتي للزي الموحد",
    description:
      "متجر فرصتي للزي الموحد الطبي والمدرسي – توصيل لجميع مناطق السعودية",
    images: ["https://fursatiuniforms.com/og-image.jpg"],
  },

  alternates: {
    canonical: "https://fursatiuniforms.com",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// =============================
// 🏠 Homepage
// =============================
export default async function Home() {
  const categories = await getCategories();

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
    description:
      "متجر فرصتي للزي الموحد الطبي والمدرسي في السعودية. جودة عالية وأسعار مناسبة مع توصيل سريع.",
    socialLinks: [
      "https://twitter.com/fursatiuniforms",
      "https://instagram.com/fursatiuniforms",
      "https://facebook.com/fursatiuniforms",
      "https://tiktok.com/@fursatiuniforms",
    ],
  };

  const organizationSchema = generateOrganizationSchema(siteConfig);
  const websiteSchema = generateWebsiteSchema(siteConfig);

  return (
    <>
      {/* ✅ Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(organizationSchema)}
      />

      {/* ✅ Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(websiteSchema)}
      />

      {/* =============================
          📦 Page Content
      ============================= */}
      <main>
        <BannerSlider />
        <StoriesSlider />

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

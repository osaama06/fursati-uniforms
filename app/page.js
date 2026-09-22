// app/page.js

// ✅ حل مشكلة فيرسل: إجبار الصفحة على العمل كوضع ديناميكي لتجنب خطأ الـ Build
export const dynamic = "force-dynamic";

import { headers } from "next/headers";

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
// 🧠 Fetch Categories (Under ID: 59)
// =============================
async function getHomeCategories() {
  try {
    const res = await fetch(
      "https://fursatiuniforms.store/wp-json/wc/v3/products/categories?per_page=100&hide_empty=false",
      {
        headers: { Authorization: `Basic ${getAuthHeader()}` },
        // ✅ تم التغيير من 0 إلى 60 لتجنب مشاكل الـ Static Generation في فيرسل
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();

    // فلترة التصنيفات التابعة للأب 59 وترتيبها
    return data
      .filter((cat) => String(cat.parent) === "59")
      .sort((a, b) => a.menu_order - b.menu_order);
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
      `https://fursatiuniforms.store/wp-json/wc/v3/products?category=${categoryId}&status=publish&per_page=10`,
      {
        headers: { Authorization: `Basic ${getAuthHeader()}` },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return [];

    return await res.json();
  } catch (error) {
    return [];
  }
}

// =============================
// 🖼️ Fetch Banner Type
// =============================
async function fetchBannerType(type) {
  try {
    const res = await fetch(
      `https://fursatiuniforms.store/wp-json/wp/v2/${type}?_embed&per_page=10`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.error(`Failed to fetch ${type}:`, res.status);
      return [];
    }

    const data = await res.json();

    return data
      .map((post) => {
        const media = post?._embedded?.["wp:featuredmedia"];

        const embeddedImage =
          media?.[0] && !media?.[0]?.code
            ? media[0]?.source_url || ""
            : "";

        const fallbackYoastImage =
          post?.yoast_head_json?.og_image?.[0]?.url || "";

        return {
          id: post.id,
          image: embeddedImage || fallbackYoastImage || "",
          link: post?.acf?.banner_link || "",
        };
      })
      .filter((item) => item.image);
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    return [];
  }
}

// =============================
// 🖼️ Fetch Correct Homepage Banners
// =============================
async function getBanners(isMobile) {
  const preferredType = isMobile
    ? "mobile_banner"
    : "banner";

  const fallbackType = isMobile
    ? "banner"
    : "mobile_banner";

  // أولاً: جيب النوع الصحيح للجهاز
  const preferredBanners =
    await fetchBannerType(preferredType);

  if (preferredBanners.length > 0) {
    return preferredBanners;
  }

  // فقط لو النوع المطلوب فاضي أو فشل
  // استخدم النوع الآخر كـ fallback
  return await fetchBannerType(fallbackType);
}

// =============================
// ✅ Metadata (Homepage)
// =============================
export const metadata = {
  title: "فرصتي | تسوق جميع منتجات الزي الموحد",

  description:
    "متجر فرصتي للزي الموحد الطبي والمدرسي. سكراب طبي، مريول مدرسي، لابكوت، زي موحد بجودة عالية وأسعار مناسبة.",

  openGraph: {
    title: "فرصتي | متجر الزي الموحد",

    description: "متجر فرصتي للزي الموحدي.",

    url: "https://www.fursatiuniforms.com",

    siteName: "فرصتي",

    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
      },
    ],

    locale: "ar_SA",

    type: "website",
  },
};

// =============================
// 🏠 Homepage Component
// =============================
export default async function Home() {
  // =============================
  // 📱 Detect Device ONCE on Server
  // =============================
  const headersList = await headers();

  const userAgent =
    headersList.get("user-agent") || "";

  const clientHintMobile =
    headersList.get("sec-ch-ua-mobile");

  const isMobile =
    clientHintMobile === "?1" ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  // =============================
  // 1. Categories + correct banners
  // =============================
  const [categories, banners] = await Promise.all([
    getHomeCategories(),
    getBanners(isMobile),
  ]);

  // =============================
  // 2. جلب منتجات كل قسم بالتوازي
  // =============================
  const sliders = await Promise.all(
    categories.map(async (category) => {
      const products =
        await getProductsByCategoryId(category.id);

      return {
        category,
        products,
      };
    })
  );

  // =============================
  // Schema Config
  // =============================
  const siteConfig = {
    name: "فرصتي",

    alternateName: [
      "Fursati",
      "Fursati Uniforms",
    ],

    url: "https://www.fursatiuniforms.com",

    logo:
      "https://www.fursatiuniforms.com/logo.png",

    description:
      "متجر فرصتي للزي الموحد الطبي والمدرسي في السعودية.",
  };

  const organizationSchema =
    generateOrganizationSchema(siteConfig);

  const websiteSchema =
    generateWebsiteSchema(siteConfig);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(
          organizationSchema
        )}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(
          websiteSchema
        )}
      />

      <main>
        {/* السلايدر الرئيسي في الأعلى */}
        <BannerSlider banners={banners} />

        {/* عرض أقسام الهوم الديناميكية */}
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
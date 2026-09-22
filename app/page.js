// app/page.js

// ✅ حل مشكلة فيرسل: إجبار الصفحة على العمل كوضع ديناميكي لتجنب خطأ الـ Build
export const dynamic = "force-dynamic";

import { unstable_cache } from "next/cache";
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
// 🖼️ Fetch Homepage Banners
// Server-side + Cache لمدة ساعة
// =============================
const getBanners = unstable_cache(
  async () => {
    try {
      const [desktopRes, mobileRes] = await Promise.all([
        fetch(
          "https://fursatiuniforms.store/wp-json/wp/v2/banner?_embed&per_page=10"
        ),
        fetch(
          "https://fursatiuniforms.store/wp-json/wp/v2/mobile_banner?_embed&per_page=10"
        ),
      ]);

      if (!desktopRes.ok || !mobileRes.ok) {
        throw new Error("فشل في جلب البانرات");
      }

      const [desktopData, mobileData] = await Promise.all([
        desktopRes.json(),
        mobileRes.json(),
      ]);

      const desktopBanners = desktopData
        .map((post) => {
          const media = post?._embedded?.["wp:featuredmedia"];

          return {
            id: post.id,
            image: media?.[0]?.source_url || "",
            link: post?.acf?.banner_link || "",
          };
        })
        .filter((item) => item.image);

      const mobileBanners = mobileData
        .map((post) => {
          const media = post?._embedded?.["wp:featuredmedia"];

          const embeddedImage =
            media?.[0] && !media?.[0]?.code
              ? media[0].source_url
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

      return {
        desktopBanners,
        mobileBanners,
      };
    } catch (error) {
      console.error("Error fetching banners:", error);

      return {
        desktopBanners: [],
        mobileBanners: [],
      };
    }
  },
  ["homepage-banners"],
  {
    revalidate: 3600,
  }
);

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
  // 1. جلب أقسام الهوم والبانرات بالتوازي
  const [categories, bannersData] = await Promise.all([
    getHomeCategories(),
    getBanners(),
  ]);

  // 2. جلب منتجات كل قسم بالتوازي لسرعة الأداء
  const sliders = await Promise.all(
    categories.map(async (category) => {
      const products = await getProductsByCategoryId(category.id);

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

    logo: "https://www.fursatiuniforms.com/logo.png",

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
        <BannerSlider
          desktopBanners={
            bannersData.desktopBanners
          }
          mobileBanners={
            bannersData.mobileBanners
          }
        />

        {/* عرض أقسام الهوم الديناميكية */}
        {sliders.map(
          ({ category, products }) =>
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
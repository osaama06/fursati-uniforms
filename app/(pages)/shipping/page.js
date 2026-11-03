import "@/styles/pages/info-pages.css";

// ---------------------
// 🟦 Static + ISR
// ---------------------
// الصفحة تنبني مرة وتتحدث كل ساعة
export const revalidate = 3600;

const SITE_URL = "https://www.fursatiuniforms.com";
const PAGE_PATH = "/shipping";
const WP_PAGE_ID = 508;

// ---------------------
// 🟦 Metadata
// ---------------------
export const metadata = {
  // الـ template في layout.js يضيف " | فرصتي" تلقائياً
  title: "سياسة الشحن",
  description:
    "اطلع على سياسة الشحن الخاصة بفرصتي، مواعيد التوصيل، الرسوم، مناطق الشحن، وسياسة التعامل مع التأخير.",
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    title: "سياسة الشحن | فرصتي",
    description:
      "تعرف على تفاصيل سياسة الشحن والتوصيل في فرصتي. مواعيد الشحن والرسوم والمناطق المغطاة.",
    type: "article",
    locale: "ar_SA",
    url: `${SITE_URL}${PAGE_PATH}`,
    siteName: "فرصتي",
  },
};

// ---------------------
// 🟦 Fetch مع مهلة ومحاولة ثانية
// ---------------------
async function getWpPage(id) {
  const WP_BASE = (
    process.env.WOO_URL || "https://fursatiuniforms.store"
  ).replace(/\/$/, "");

  const url = `${WP_BASE}/wp-json/wp/v2/pages/${id}?_fields=title,content`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch page: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.error(
        `Shipping page fetch failed (attempt ${attempt}):`,
        error?.cause?.code || error?.message
      );
    }
  }

  return null;
}

// ---------------------
// 🟦 الصفحة
// ---------------------
export default async function ShippingPolicyPage() {
  const page = await getWpPage(WP_PAGE_ID);

  const title = page?.title?.rendered || "سياسة الشحن";
  const content = page?.content?.rendered || "";

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "سياسة الشحن",
    description:
      "اقرأ سياسة الشحن الخاصة بفرصتي، بما يشمل أوقات التوصيل والرسوم والمناطق المتاحة.",
    url: `${SITE_URL}${PAGE_PATH}`,
    publisher: {
      "@type": "Organization",
      name: "فرصتي",
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  // div بدل main — الـ layout فيه <main> أصلاً
  return (
    <div className="wp-page-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData),
        }}
      />

      <h1
        dangerouslySetInnerHTML={{
          __html: title,
        }}
      />

      {content ? (
        <article
          className="wp-page-content"
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />
      ) : (
        <p>تعذر تحميل المحتوى حالياً.</p>
      )}
    </div>
  );
}
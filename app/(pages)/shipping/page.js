import "@/styles/pages/info-pages.css";

// ---------------------
// 🟦 Dynamic Rendering
// ---------------------
export const dynamic = "force-dynamic";

// ---------------------
// 🟦 Metadata
// ---------------------
export const metadata = {
  title: "سياسة الشحن | فرصتي يونيفورمز",
  description:
    "اطلع على سياسة الشحن الخاصة بفرصتي يونيفورمز، مواعيد التوصيل، الرسوم، مناطق الشحن، وسياسة التعامل مع التأخير.",
  openGraph: {
    title: "سياسة الشحن | فرصتي يونيفورمز",
    description:
      "تعرف على تفاصيل سياسة الشحن والتوصيل في فرصتي يونيفورمز. مواعيد الشحن والرسوم والمناطق المغطاة.",
    type: "article",
    locale: "ar_AR",
    url: "https://fursatiuniforms.com/shipping-policy",
    siteName: "فرصتي يونيفورمز",
  },
};

// ---------------------
// 🟦 الصفحة
// ---------------------
export default async function ShippingPolicyPage() {
  const WP_BASE =
    process.env.WOO_URL || "https://fursatiuniforms.store";

  try {
    const res = await fetch(
      `${WP_BASE.replace(/\/$/, "")}/wp-json/wp/v2/pages/508`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch page: ${res.status}`);
    }

    const page = await res.json();

    const title = page.title?.rendered || "سياسة الشحن";
    const content = page.content?.rendered || "";

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "سياسة الشحن",
      description:
        "اقرأ سياسة الشحن الخاصة بفرصتي يونيفورمز، بما يشمل أوقات التوصيل والرسوم والمناطق المتاحة.",
      url: "https://fursatiuniforms.com/shipping-policy",
      publisher: {
        "@type": "Organization",
        name: "فرصتي يونيفورمز",
        url: "https://fursatiuniforms.com",
        logo: {
          "@type": "ImageObject",
          url: "https://fursatiuniforms.com/logo.png",
        },
      },
    };

    return (
      <main className="wp-page-container">
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

        <article
          className="wp-page-content"
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />
      </main>
    );
  } catch (error) {
    console.error("Shipping page error:", error);

    return (
      <main className="wp-page-container">
        <h1>سياسة الشحن</h1>
        <p>تعذر تحميل المحتوى حالياً.</p>
      </main>
    );
  }
}
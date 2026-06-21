import "@/styles/pages/info-pages.css";

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
// 🟦 الصفحة + سكيما
// ---------------------
export default async function ShippingPolicyPage() {
  const WP_BASE = process.env.WOO_URL || "https://fursatiuniforms.store";

  const res = await fetch(
    `${WP_BASE.replace(/\/$/, "")}/wp-json/wp/v2/pages/508`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return (
      <main className="wp-page-container">
        <h1>سياسة الشحن</h1>
        <p>هنالك خطأ ما.</p>
      </main>
    );
  }

  const page = await res.json();

  const title = page.title?.rendered || "سياسة الشحن";
  const content = page.content?.rendered || "";

  // ---------------------
  // 🟦 JSON-LD Schema
  // ---------------------
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
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <h1 dangerouslySetInnerHTML={{ __html: title }} />

      <article
        className="wp-page-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  );
}

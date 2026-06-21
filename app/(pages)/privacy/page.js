import "@/styles/pages/info-pages.css";
export const dynamic = "force-dynamic";

// ---------------------
// 🟦 Metadata | Privacy Policy
// ---------------------
export const metadata = {
  title: "سياسة الخصوصية | فرصتي يونيفورمز",
  description:
    "تعرف على سياسة الخصوصية في فرصتي يونيفورمز، وكيفية جمع واستخدام وحماية البيانات الشخصية وحقوق المستخدم.",
  openGraph: {
    title: "سياسة الخصوصية | فرصتي يونيفورمز",
    description:
      "اطلع على سياسة الخصوصية الخاصة بفرصتي يونيفورمز، ومعرفة كيفية التعامل مع بياناتك الشخصية وحمايتها.",
    type: "article",
    locale: "ar_AR",
    url: "https://fursatiuniforms.com/privacy-policy",
    siteName: "فرصتي يونيفورمز",
  },
};

// ---------------------
// 🟦 الصفحة + السكيما
// ---------------------
export default async function PrivacyPolicyPage() {
  const WP_BASE = process.env.WOO_URL || "https://fursatiuniforms.store";

  // 🔴 غير رقم الصفحة حسب ID صفحة الخصوصية في ووردبريس
  const res = await fetch(
    `${WP_BASE.replace(/\/$/, "")}/wp-json/wp/v2/pages/571`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return (
      <main className="wp-page-container">
        <h1>سياسة الخصوصية</h1>
        <p>هنالك خطأ ما.</p>
      </main>
    );
  }

  const page = await res.json();

  const title = page.title?.rendered || "سياسة الخصوصية";
  const content = page.content?.rendered || "";

  // ---------------------
  // 🟦 JSON-LD Schema | Privacy Policy
  // ---------------------
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "سياسة الخصوصية",
    description:
      "توضح سياسة الخصوصية في فرصتي يونيفورمز كيفية جمع واستخدام وحماية البيانات الشخصية للمستخدمين.",
    url: "https://fursatiuniforms.com/privacy-policy",
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

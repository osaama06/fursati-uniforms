import "@/styles/pages/info-pages.css";
export const dynamic = "force-dynamic";

// تنظيف HTML من التاجات
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

// ⚡ دالة لجلب صفحة WordPress
async function getPage() {
  const WP_BASE = process.env.WOO_URL || "https://furssati.io";

  const res = await fetch(
    `${WP_BASE.replace(/\/$/, "")}/wp-json/wp/v2/pages/492`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) return null;
  return res.json();
}

// ⚡ إصلاح روابط Yoast تلقائياً
function fixYoastDomain(str = "") {
  return str.replace(/https?:\/\/furssati\.io/gi, "https://fursatiuniforms.com");
}

// ⚡ Metadata
export async function generateMetadata() {
  const page = await getPage();

  if (!page) {
    return {
      title: "سياسة الإرجاع والاستبدال | فرصتي يونيفورمز",
      description:
        "تعرف على سياسة الإرجاع والاستبدال في متجر فرصتي يونيفورمز.",
      alternates: {
        canonical: "https://fursatiuniforms.com/return-policy",
      },
    };
  }

  const yoast = page.yoast_head_json || {};
  const fixedCanonical =
    fixYoastDomain(yoast.canonical) ||
    "https://fursatiuniforms.com/return-policy";

  return {
    title: yoast.title || page.title?.rendered,
    description:
      stripHtml(yoast.description) ||
      stripHtml(page.excerpt?.rendered) ||
      "تعرف على سياسة الإرجاع والاستبدال في متجر فرصتي يونيفورمز.",
    alternates: { canonical: fixedCanonical },

    openGraph: {
      title: yoast.og_title || yoast.title,
      description:
        stripHtml(yoast.og_description) ||
        stripHtml(yoast.description) ||
        "",
      url: fixedCanonical,
      images:
        yoast.og_image?.map((img) => ({
          url: fixYoastDomain(img.url),
          width: img.width,
          height: img.height,
        })) || [],
      type: "article",
      siteName: "Fursati Uniforms",
    },

    twitter: {
      card: "summary_large_image",
      title: yoast.twitter_title || yoast.title,
      description:
        stripHtml(yoast.twitter_description) ||
        stripHtml(yoast.description) ||
        "",
      images: yoast.twitter_image
        ? [fixYoastDomain(yoast.twitter_image)]
        : [],
    },
  };
}

// ⚡ Schema
function WebPageSchema(page) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: stripHtml(page.title.rendered),
    url: "https://fursatiuniforms.com/return-policy",
    description: stripHtml(page.excerpt?.rendered || page.content?.rendered),
  };
}

function BreadcrumbSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: "https://fursatiuniforms.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "سياسة الإرجاع والاستبدال",
        item: "https://fursatiuniforms.com/return-policy",
      },
    ],
  };
}

// ⚡ الصفحة نفسها
export default async function ReturnPolicyPage() {
  const page = await getPage();

  if (!page) {
    return (
      <main className="wp-page-container">
        <h1>سياسة الإرجاع والاستبدال</h1>
        <p>تعذر جلب محتوى الصفحة من ووردبريس.</p>
      </main>
    );
  }

  return (
    <main className="wp-page-container">
      {/* Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(WebPageSchema(page)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(BreadcrumbSchema()),
        }}
      />

      <h1 dangerouslySetInnerHTML={{ __html: page.title.rendered }} />

      <article
        className="wp-page-content"
        dangerouslySetInnerHTML={{
          __html: fixYoastDomain(page.content.rendered),
        }}
      />
    </main>
  );
}

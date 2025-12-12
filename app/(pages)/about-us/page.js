import "@/styles/pages/info-pages.css";
import { Metadata } from "next";

export const metadata = {
  title: "من نحن | فرصتي يونيفورمز",
  description:
    "تعرف على فرصتي يونيفورمز: متجر متخصص في الزي الطبي والمدرسي بجودة عالية وتصاميم مميزة، مع خدمة عملاء احترافية وتوصيل سريع.",
  openGraph: {
    title: "من نحن | فرصتي يونيفورمز",
    description:
      "من نحن: تعرف على رؤيتنا ورسالتنا في تقديم أفضل خيارات الزي الطبي والمدرسي.",
    type: "article",
    locale: "ar_AR",
    url: "https://fursati-uniforms.com/about-us",
    siteName: "فرصتي يونيفورمز",
  },
};

export default async function AboutUsPage() {
  const WP_BASE = process.env.WOO_URL || "https://furssati.io";

  const res = await fetch(
    `${WP_BASE.replace(/\/$/, "")}/wp-json/wp/v2/pages/504`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return (
      <main className="wp-page-container">
        <p>هنالك خطأ ما.</p>
      </main>
    );
  }

  const page = await res.json();

  const title = page.title?.rendered || "من نحن";
  const content = page.content?.rendered || "";

  // 🔥 JSON-LD Schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "من نحن",
    description:
      "تعرف على فرصتي يونيفورمز، متجر متخصص في الزي الطبي والمدرسي بجودة عالية.",
    url: "https://fursati-uniforms.com/about-us",
    publisher: {
      "@type": "Organization",
      name: "فرصتي يونيفورمز",
      url: "https://fursati-uniforms.com",
    },
  };

  return (
    <main className="wp-page-container">
      {/* Inject Schema JSON-LD */}
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

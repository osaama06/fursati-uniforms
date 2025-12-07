import "@/styles/info-pages.css";

export default async function ReturnPolicyPage() {
  const WP_BASE = process.env.WOO_URL || "https://furssati.io";

  const res = await fetch(
    `${WP_BASE.replace(/\/$/, "")}/wp-json/wp/v2/pages/492`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return (
      <main className="wp-page-container">
        <h1>سياسة الإرجاع والاستبدال</h1>
        <p>تعذر جلب محتوى الصفحة من ووردبريس.</p>
      </main>
    );
  }

  const page = await res.json();

  const title = page.title?.rendered || "سياسة الإرجاع والاستبدال";
  const content = page.content?.rendered || "";

  return (
    <main className="wp-page-container">
      <h1 dangerouslySetInnerHTML={{ __html: title }} />

      <article
        className="wp-page-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  );
}

// lib/seo.js
export async function getYoastSEO(path) {
  try {
    const fullUrl = `${process.env.WOO_URL}${path}`;

    const res = await fetch(
      `${process.env.WOO_URL}/wp-json/yoast/v1/get_head?url=${encodeURIComponent(fullUrl)}`,
      { cache: "no-store" }
    );

    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return null;
    }

    const data = await res.json();

    return {
      title: data.json?.title || null,
      metaDesc: data.json?.description || null,
      metaKeywords: data.json?.keywords || null,
      metaRobotsNoindex: data.json?.robots?.index === "noindex",
      metaRobotsNofollow: data.json?.robots?.follow === "nofollow",
      opengraphTitle: data.json?.og_title || null,
      opengraphDescription: data.json?.og_description || null,
      opengraphImage: { sourceUrl: data.json?.og_image || null },
      twitterTitle: data.json?.twitter_title || null,
      twitterDescription: data.json?.twitter_description || null,
      twitterImage: { sourceUrl: data.json?.twitter_image || null },
      canonical: data.json?.canonical || null,
    };
  } catch (err) {
    return null;
  }
}

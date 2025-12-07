// lib/seo.js

// =======================
// 1) Yoast REST SEO
// =======================
export async function getYoastSEO(path) {
  try {
    const base = process.env.WOO_URL;
    if (!base) return null;

    const fullUrl = `${base}${path}`;
    const endpoint = `${base}/wp-json/yoast/v1/get_head?url=${encodeURIComponent(fullUrl)}`;

    const res = await fetch(endpoint, { cache: "no-store" });
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("❌ Yoast returned non-JSON:", text.slice(0, 200));
      return null;
    }

    return await res.json();

  } catch (err) {
    console.error("❌ Yoast SEO Error:", err);
    return null;
  }
}



// =======================
// 2) GraphQL SEO (WPGraphQL + Yoast)
// =======================
export async function getGraphQLSEO({ slug, type = "page" }) {
  try {
    const endpoint = `${process.env.WOO_URL}/graphql`;

    const query = `
      query GetSEO($slug: ID!) {
        ${type}(id: $slug, idType: SLUG) {
          seo {
            title
            metaDesc
            focuskw
            metaKeywords
            metaRobotsNoindex
            metaRobotsNofollow
            opengraphTitle
            opengraphDescription
            opengraphImage {
              sourceUrl
            }
            twitterTitle
            twitterDescription
            twitterImage {
              sourceUrl
            }
            canonical
            schema {
              raw
            }
          }
        }
      }
    `;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { slug },
      }),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Response is not JSON:", text.slice(0, 200));
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      console.error("❌ GraphQL SEO Errors:", result.errors);
      return null;
    }

    return result.data?.[type]?.seo || null;

  } catch (err) {
    console.error("❌ GraphQL SEO Fetch Error:", err);
    return null;
  }
}

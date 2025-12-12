import Image from "next/image";

/* ============================
   1) جلب المقال من WordPress
============================ */
async function getPost(slug) {
  const res = await fetch(
    `https://furssati.io/wp-json/wp/v2/posts?slug=${slug}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data.length ? data[0] : null;
}

/* ============================================
   2) جلب Yoast SEO للمقال (Title/Desc/Schema)
============================================= */
async function getYoastSEO(url) {
  const res = await fetch(
    `https://furssati.io/wp-json/yoast/v1/get_head?url=${url}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) return null;

  return res.json();
}

/* ======================================
   3) generateMetadata ديناميك كامل
======================================= */
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: "المقال غير موجود - فرصة",
      description: "عذراً، لم يتم العثور على المقال المطلوب.",
    };
  }

  // *** التعديل هنا ***
  const postUrl = `https://fursatiuniforms.com/blog/${params.slug}`;

  const yoast = await getYoastSEO(postUrl);

  if (!yoast?.json) {
    return {
      title: post.title.rendered,
      description: post.excerpt?.rendered?.replace(/<[^>]*>/g, ""),
      alternates: { canonical: postUrl },
    };
  }

  return {
    title: yoast.json.title,
    description: yoast.json.description,
    alternates: { canonical: yoast.json.canonical },
    openGraph: {
      title: yoast.json.og_title,
      description: yoast.json.og_description,
      images: yoast.json.og_image ? [yoast.json.og_image] : [],
      url: postUrl,
      type: "article",
      locale: "ar_SA",
      siteName: "Furssati",
    },
    twitter: {
      card: "summary_large_image",
      title: yoast.json.twitter_title,
      description: yoast.json.twitter_description,
      images: yoast.json.twitter_image ? [yoast.json.twitter_image] : [],
    },
  };
}

/* ======================================
   4) صفحة المقال مع Schema JSON-LD
======================================= */
export default async function BlogSinglePage({ params }) {
  const post = await getPost(params.slug);

  if (!post) {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <h1>المقال غير موجود</h1>
      </main>
    );
  }

  // *** التعديل هنا ***
  const postUrl = `https://fursatiuniforms.com/blog/${params.slug}`;
  const yoast = await getYoastSEO(postUrl);

  const img =
    post.jetpack_featured_media_url ||
    "/placeholder.jpg";

  return (
    <main style={{ padding: "20px" }}>
      {/* ========== Yoast Schema JSON-LD ========== */}
      {yoast?.json?.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(yoast.json.schema) }}
        />
      )}

      {/* ========== INLINE CSS ========== */}
      <style>{`
        .single-post-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .single-post-title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: right;
        }

        .single-post-image-wrapper {
          position: relative;
          width: 100%;
          height: 350px;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 25px;
        }

        @media (max-width: 600px) {
          .single-post-image-wrapper {
            height: 250px;
          }
          .single-post-title {
            font-size: 26px;
          }
        }

        .single-post-content {
          font-size: 18px;
          line-height: 1.9;
          text-align: right;
        }

        .single-post-content img {
          width: 100%;
          height: auto;
          border-radius: 14px;
          margin: 20px 0;
        }
      `}</style>

      {/* ========== CONTENT ========== */}
      <div className="single-post-container">
        <h1
          className="single-post-title"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />

        <div className="single-post-image-wrapper">
          <Image
            src={img}
            alt={post.title.rendered}
            fill
            sizes="100vw"
            className="single-post-image"
          />
        </div>

        <article
          className="single-post-content"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
      </div>
    </main>
  );
}

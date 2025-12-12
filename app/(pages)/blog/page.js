import Link from "next/link";
import Image from "next/image";
import "@/styles/blog.css";

// =========================================================
// 1) جلب بوستات WordPress
// =========================================================
async function getPosts() {
  const res = await fetch("https://furssati.io/wp-json/wp/v2/posts", {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

// =========================================================
// 2) Yoast SEO — مع تصحيح الدومين للفرونت
// =========================================================
async function getYoastSEO() {
  const frontendUrl = "https://fursatiuniforms.com/blog";

  const res = await fetch(
    `https://furssati.io/wp-json/yoast/v1/get_head?url=${frontendUrl}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}

// =========================================================
// 3) Metadata
// =========================================================
export async function generateMetadata() {
  const seo = await getYoastSEO();

  if (!seo) {
    return {
      title: "المدونة | متجر فرصتي",
      description: "مقالات حول الزي الطبي والمدرسي.",
      alternates: {
        canonical: "https://fursatiuniforms.com/blog",
      },
    };
  }

  const head = seo?.json || {};

  return {
    title: head.title || "المدونة",
    description: head.description || "",
    alternates: {
      canonical: head.canonical || "https://fursatiuniforms.com/blog",
    },
    openGraph: {
      title: head.og_title,
      description: head.og_description,
      url: "https://fursatiuniforms.com/blog",
      images: head.og_image?.map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
      })),
      type: "website",
      locale: "ar_SA",
      siteName: "Fursati Uniforms",
    },
    twitter: {
      card: head.twitter_card,
      title: head.twitter_title,
      description: head.twitter_description,
      images: head.twitter_image ? [head.twitter_image] : [],
    },
  };
}

// =========================================================
// 4) Blog Schema + Breadcrumb
// =========================================================
function BlogSchema(posts) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "مدونة متجر فرصتي",
    url: "https://fursatiuniforms.com/blog",
    description: "مقالات ونصائح حول الزي الطبي والمدرسي والخامات والقياسات.",
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title.rendered,
      url: `https://fursatiuniforms.com/blog/${post.slug}`,
      image:
        post?.better_featured_image?.source_url ||
        post?.yoast_head_json?.og_image?.[0]?.url ||
        "",
      datePublished: post.date,
      dateModified: post.modified,
    })),
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
        name: "المدونة",
        item: "https://fursatiuniforms.com/blog",
      },
    ],
  };
}

// =========================================================
// 5) Blog Page
// =========================================================
export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="blog-container">
      {/* Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(BlogSchema(posts)),
        }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(BreadcrumbSchema()),
        }}
      />

      <h1 className="blog-title">المدونة</h1>

      <div className="blog-grid">
        {posts.map((post) => {
          const img =
            post?.better_featured_image?.source_url ||
            post?.yoast_head_json?.og_image?.[0]?.url ||
            "/placeholder.jpg";

          return (
            <Link
              href={`/blog/${post.slug}`}
              key={post.id}
              className="blog-card"
            >
              <div className="blog-image-wrapper">
                <Image
                  src={img}
                  alt={post.title.rendered}
                  width={200}
                  height={130}
                  className="blog-image"
                />
              </div>

              <div className="blog-card-body">
                <h2
                  className="blog-card-title"
                  dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                />

                <p
                  className="blog-card-excerpt"
                  dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

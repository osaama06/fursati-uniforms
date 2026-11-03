import Link from "next/link";
import Image from "next/image";
import "@/styles/pages/blog.css";

// =========================================================
// Static + ISR — الصفحة تتحدث كل 10 دقائق
// =========================================================
export const revalidate = 600;

const SITE_URL = "https://www.fursatiuniforms.com";
const WP_BASE = (
  process.env.WOO_URL || "https://fursatiuniforms.store"
).replace(/\/$/, "");

// =========================================================
// 1) جلب بوستات WordPress — مع مهلة ومحاولة ثانية
// =========================================================
async function getPosts() {
  const fields = [
    "id",
    "slug",
    "title",
    "excerpt",
    "date",
    "modified",
    "better_featured_image",
    "yoast_head_json",
  ].join(",");

  const url = `${WP_BASE}/wp-json/wp/v2/posts?per_page=20&_fields=${fields}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 600 },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.status}`);
      }

      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(
        `Blog posts fetch failed (attempt ${attempt}):`,
        error?.cause?.code || error?.message
      );
    }
  }

  return [];
}

// =========================================================
// Helpers
// =========================================================
function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function getPostImage(post) {
  return (
    post?.better_featured_image?.source_url ||
    post?.yoast_head_json?.og_image?.[0]?.url ||
    ""
  );
}

// =========================================================
// 2) Metadata — ثابتة، بدون Yoast
// =========================================================
export const metadata = {
  // الـ template في layout.js يضيف " | فرصتي" تلقائياً
  title: "المدونة",
  description:
    "مقالات ونصائح حول الزي الطبي والمدرسي، الخامات، والمقاسات من متجر فرصتي.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "المدونة | فرصتي",
    description:
      "مقالات ونصائح حول الزي الطبي والمدرسي، الخامات، والمقاسات من متجر فرصتي.",
    url: `${SITE_URL}/blog`,
    type: "website",
    locale: "ar_SA",
    siteName: "فرصتي",
  },
};

// =========================================================
// 3) Blog Schema + Breadcrumb
// =========================================================
function BlogSchema(posts) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "مدونة متجر فرصتي",
    url: `${SITE_URL}/blog`,
    description:
      "مقالات ونصائح حول الزي الطبي والمدرسي والخامات والقياسات.",
    blogPost: posts.map((post) => {
      const image = getPostImage(post);

      return {
        "@type": "BlogPosting",
        headline: stripHtml(post?.title?.rendered),
        url: `${SITE_URL}/blog/${post.slug}`,
        ...(image ? { image } : {}),
        datePublished: post.date,
        dateModified: post.modified,
      };
    }),
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
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "المدونة",
        item: `${SITE_URL}/blog`,
      },
    ],
  };
}

// =========================================================
// 4) Blog Page
// =========================================================
export default async function BlogPage() {
  const posts = await getPosts();

  // div بدل main — الـ layout فيه <main> أصلاً
  return (
    <div className="blog-container">
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

      {posts.length === 0 ? (
        <p>لا توجد مقالات حالياً.</p>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => {
            const img = getPostImage(post) || "/placeholder.jpg";

            return (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className="blog-card"
              >
                <div className="blog-image-wrapper">
                  <Image
                    src={img}
                    alt={stripHtml(post?.title?.rendered)}
                    width={200}
                    height={130}
                    className="blog-image"
                  />
                </div>

                <div className="blog-card-body">
                  <h2
                    className="blog-card-title"
                    dangerouslySetInnerHTML={{
                      __html: post?.title?.rendered || "",
                    }}
                  />

                  <p
                    className="blog-card-excerpt"
                    dangerouslySetInnerHTML={{
                      __html: post?.excerpt?.rendered || "",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
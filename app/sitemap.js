// app/sitemap.js

// الـ sitemap ينبني مرة ويتحدث كل ساعة
export const revalidate = 3600;

const BASE_URL = "https://www.fursatiuniforms.com";
const WP_BASE = (
  process.env.WOO_URL || "https://fursatiuniforms.store"
).replace(/\/$/, "");

// على Vercel: لو فشل الجلب نرمي خطأ بدل ما نطلع sitemap ناقص.
// وقت الـ build يفشل الـ deploy ويبقى القديم شغال،
// ووقت التحديث (ISR) يبقى الـ sitemap القديم في الكاش.
// على جهازك: نكمل بدون البيانات عشان ما يوقفك الـ build المحلي.
const STRICT = Boolean(process.env.VERCEL);

function authHeader() {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  return { Authorization: `Basic ${auth}` };
}

// =============================
// fetch مع مهلة ومحاولة ثانية
// =============================
async function fetchJson(url, options = {}) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${url}`);
      }

      return {
        data: await res.json(),
        totalPages: Number(res.headers.get("x-wp-totalpages") || 1),
      };
    } catch (error) {
      lastError = error;
      console.error(
        `Sitemap fetch failed (attempt ${attempt}):`,
        error?.cause?.code || error?.message
      );
    }
  }

  throw lastError;
}

// =============================
// جلب كل الصفحات (pagination)
// =============================
async function fetchAll(buildUrl, options) {
  const first = await fetchJson(buildUrl(1), options);
  let items = Array.isArray(first.data) ? first.data : [];

  for (let page = 2; page <= first.totalPages; page++) {
    const next = await fetchJson(buildUrl(page), options);
    if (Array.isArray(next.data)) items = items.concat(next.data);
  }

  return items;
}

async function safe(label, fn) {
  try {
    return await fn();
  } catch (error) {
    if (STRICT) throw error;
    console.warn(`⚠ Sitemap: skipped ${label} (local build)`);
    return [];
  }
}

// =============================
// المنتجات — slug + تاريخ التعديل فقط
// =============================
function getProducts() {
  return safe("products", () =>
    fetchAll(
      (page) =>
        `${WP_BASE}/wp-json/wc/v3/products?status=publish&per_page=100&page=${page}&_fields=slug,date_modified_gmt`,
      { headers: authHeader() }
    )
  );
}

// =============================
// التصنيفات — slug فقط
// =============================
function getCategories() {
  return safe("categories", () =>
    fetchAll(
      (page) =>
        `${WP_BASE}/wp-json/wc/v3/products/categories?hide_empty=true&per_page=100&page=${page}&_fields=slug`,
      { headers: authHeader() }
    )
  );
}

// =============================
// مقالات المدونة
// =============================
function getPosts() {
  return safe("posts", () =>
    fetchAll(
      (page) =>
        `${WP_BASE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_fields=slug,modified_gmt`
    )
  );
}

function toDate(gmt) {
  if (!gmt) return undefined;
  const d = new Date(`${gmt}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// =============================
// Sitemap
// =============================
export default async function sitemap() {
  const [products, categories, posts] = await Promise.all([
    getProducts(),
    getCategories(),
    getPosts(),
  ]);

  // الصفحات الثابتة — بدون lastModified لأن تاريخها ما يتغير فعلياً
  const staticPages = [
    "/",
    "/products",
    "/blog",
    "/about-us",
    "/contact",
    "/shipping",
    "/return-policy",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: path === "/" ? `${BASE_URL}/` : `${BASE_URL}${path}`,
  }));

  const productPages = products
    .filter((p) => p?.slug)
    .map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: toDate(p.date_modified_gmt),
    }));

  // بدون /category لأن مسارات التصنيفات مباشرة مثل /scrubs
  const categoryPages = categories
    .filter((c) => c?.slug)
    .map((c) => ({
      url: `${BASE_URL}/${c.slug}`,
    }));

  const postPages = posts
    .filter((p) => p?.slug)
    .map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: toDate(p.modified_gmt),
    }));

  // إزالة التكرار (مثل /products لو فيه تصنيف بنفس الاسم)
  const seen = new Set();

  return [...staticPages, ...productPages, ...categoryPages, ...postPages]
    .filter((entry) => {
      if (seen.has(entry.url)) return false;
      seen.add(entry.url);
      return true;
    })
    .map((entry) =>
      entry.lastModified ? entry : { url: entry.url }
    );
}
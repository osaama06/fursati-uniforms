// app/sitemap.js

// دالة لجلب المنتجات من WooCommerce
async function getProducts() {
  const consumerKey = process.env.WOO_CONSUMER_KEY;
  const secretKey = process.env.WOO_SECRET_KEY;

  const auth = Buffer.from(
    `${consumerKey}:${secretKey}`
  ).toString("base64");

  try {
    const res = await fetch(
      "https://fursatiuniforms.store/wp-json/wc/v3/products?per_page=100&status=publish",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// دالة لجلب الفئات من WooCommerce
async function getCategories() {
  const consumerKey = process.env.WOO_CONSUMER_KEY;
  const secretKey = process.env.WOO_SECRET_KEY;

  const auth = Buffer.from(
    `${consumerKey}:${secretKey}`
  ).toString("base64");

  try {
    const res = await fetch(
      "https://fursatiuniforms.store/wp-json/wc/v3/products/categories?per_page=100&hide_empty=true",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch categories:", res.status);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function sitemap() {
  // الدومين الأساسي للموقع
  const baseUrl = "https://www.fursatiuniforms.com";

  // جلب البيانات من WooCommerce
  const products = await getProducts();
  const categories = await getCategories();

  // الصفحات الثابتة
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // صفحات المنتجات
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(
      product.date_modified || product.date_created
    ),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // صفحات الفئات
  // بدون /category لأن مساراتك الحالية مباشرة مثل /scrubs
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // دمج جميع الروابط
  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
  ];
}
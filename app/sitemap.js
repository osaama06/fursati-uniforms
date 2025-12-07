// app/sitemap.js

// دالة لجلب المنتجات من WooCommerce
async function getProducts() {
  const consumerKey = process.env.WOO_CONSUMER_KEY;
  const secretKey = process.env.WOO_SECRET_KEY;
  const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString("base64");
  
  try {
    const res = await fetch(
      'https://furssati.io/wp-json/wc/v3/products?per_page=100',
      {
        headers: { Authorization: `Basic ${auth}` },
        next: { revalidate: 3600 } // تحديث كل ساعة
      }
    );
    
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// دالة لجلب الفئات من WooCommerce
async function getCategories() {
  const consumerKey = process.env.WOO_CONSUMER_KEY;
  const secretKey = process.env.WOO_SECRET_KEY;
  const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString("base64");
  
  try {
    const res = await fetch(
      'https://furssati.io/wp-json/wc/v3/products/categories?per_page=100',
      {
        headers: { Authorization: `Basic ${auth}` },
        next: { revalidate: 3600 }
      }
    );
    
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function sitemap() {
  const baseUrl = 'https://furssati.io';
  
  // جلب البيانات
  const products = await getProducts();
  const categories = await getCategories();
  
  // الصفحات الثابتة
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
  
  // صفحات المنتجات
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.date_modified || product.date_created),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  
  // صفحات الفئات
  const categoryPages = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }));
  
  // دمج كل الصفحات
  return [...staticPages, ...productPages, ...categoryPages];
}
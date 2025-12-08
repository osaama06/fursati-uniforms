//app/category/[slug]/page.js
import ProductCard from "@/app/productCard/page";
import { notFound } from "next/navigation";
import "@/styles/products-grid.css";
import { 
  generateCategorySchema, 
  generateCategoryBreadcrumb,
  renderSchema 
} from '@/utils/schema';

async function getCategoryBySlug(slug) {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");
  const res = await fetch(
    "https://furssati.io/wp-json/wc/v3/products/categories",
    { 
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    }
  );
  const categories = await res.json();
  return categories.find((cat) => cat.slug === slug);
}

async function getProductsByCategoryId(id) {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");
  const res = await fetch(
    `https://furssati.io/wp-json/wc/v3/products?category=${id}&per_page=50`,
    {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    }
  );
  return await res.json();
}

// دالة لتنظيف HTML tags
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// ✅ Generate Metadata للكاتجوري
export async function generateMetadata({ params }) {
  const category = await getCategoryBySlug(params.slug);
  
  if (!category) {
    return {
      title: 'فئة غير موجودة',
    };
  }
  
  const seo = category.yoast_seo;
  
  if (!seo) {
    return {
      title: `${category.name} - Furssati`,
      description: stripHtml(category.description) || `تسوق منتجات ${category.name}`,
    };
  }
  
  return {
    title: seo.title || `${category.name} - Furssati`,
    description: stripHtml(seo.metaDesc) || stripHtml(category.description) || `تسوق منتجات ${category.name}`,
    alternates: {
      canonical: seo.canonical || `https://furssati.io/category/${category.slug}`,
    },
    openGraph: {
      title: seo.opengraphTitle || seo.title || category.name,
      description: stripHtml(seo.opengraphDescription) || stripHtml(seo.metaDesc) || stripHtml(category.description),
      images: seo.opengraphImage ? [seo.opengraphImage] : (category.image?.src ? [category.image.src] : []),
      url: seo.canonical || `https://furssati.io/category/${category.slug}`,
      siteName: 'Furssati',
      locale: 'ar_SA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.twitterTitle || seo.title || category.name,
      description: stripHtml(seo.twitterDescription) || stripHtml(seo.metaDesc) || stripHtml(category.description),
      images: seo.twitterImage ? [seo.twitterImage] : (category.image?.src ? [category.image.src] : []),
    },
  };
}

export default async function CategoryPage({ params }) {
  const category = await getCategoryBySlug(params.slug);
  
  if (!category) {
    notFound();
  }
  
  const products = await getProductsByCategoryId(category.id);
  
  // ✅ بناء الـ Schemas
  const categorySchema = generateCategorySchema(category, products);
  const breadcrumbSchema = generateCategoryBreadcrumb(category);
  
  return (
    <>
      {/* ✅ Category CollectionPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(categorySchema)}
      />
      
      {/* ✅ Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(breadcrumbSchema)}
      />
      
      {/* محتوى الصفحة */}
      <main className="products-page">
        <div className="category-header">
          <h1>منتجات {category.name}</h1>
          
          {/* وصف الفئة إذا موجود */}
          {category.description && (
            <div 
              className="category-description"
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          )}
          
          {/* عدد المنتجات */}
          <p className="products-count">
            {products.length} منتج
          </p>
        </div>
        
        {products.length === 0 ? (
          <p className="no-products">لا توجد منتجات في هذه الفئة</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div className="product-wrapper" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
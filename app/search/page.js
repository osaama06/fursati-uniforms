import "@/styles/components/products-grid.css";
import ProductCard from "../productCard/page";
import { searchProducts } from "@/lib/api";
import { renderSchema, combineSchemas } from "@/utils/schema";

// =============================
// 🔥 Dynamic Metadata (SEO Beast)
// =============================
export async function generateMetadata({ searchParams }) {
  const query = searchParams.q?.trim() || "";

  const title =
    query.length > 0
      ? `نتائج البحث عن "${query}" | فرصتي يونيفورمز`
      : "البحث | فرصتي يونيفورمز";

  const description =
    query.length > 0
      ? `اعرض نتائج البحث داخل متجر فرصتي يونيفورمز عن: ${query}`
      : "ابحث داخل متجر فرصتي يونيفورمز عن الزي الطبي والمدرسي.";

  const cleanUrl = query
    ? `https://fursatiuniforms.com/search?q=${encodeURIComponent(query)}`
    : "https://fursatiuniforms.com/search";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: cleanUrl,
      siteName: "Fursati Uniforms",
      images: [
        {
          url: "https://fursatiuniforms.com/og-search.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "ar",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://fursatiuniforms.com/og-search.jpg"],
    },
  };
}

// =============================
// 🔥 Search Page
// =============================
export default async function SearchPage({ searchParams }) {
  const query = searchParams.q?.trim() || "";

  const products =
    query.length > 0 ? await searchProducts(query) : [];

  // =============================
  // 🔥 SCHEMA
  // =============================
  const searchSchema = {
    "@context": "https://schema.org/",
    "@type": "SearchResultsPage",
    "name": `نتائج البحث عن ${query}`,
    "description": `نتائج البحث داخل متجر فرصتي يونيفورمز عن: ${query}`,
    "url": `https://fursatiuniforms.com/search?q=${encodeURIComponent(query)}`
  };

  const listSchema =
    products.length > 0
      ? {
          "@context": "https://schema.org/",
          "@type": "ItemList",
          "numberOfItems": products.length,
          "itemListOrder": "Relevance",
          "itemListElement": products.map((p, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Product",
              "name": p.name,
              "image": p.images?.[0]?.src,
              "url": `https://fursatiuniforms.com/products/${p.slug}`,
              "offers": {
                "@type": "Offer",
                "price": p.price,
                "priceCurrency": "SAR",
              },
            },
          })),
        }
      : null;

  const combined = combineSchemas(searchSchema, listSchema);

  return (
    <>
      {/* Inject Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(combined)}
      />

      <div className="p-4">
        <h1 className="text-2xl mb-4">
          نتائج البحث عن: <span className="font-bold">{query}</span>
        </h1>

        {products.length === 0 ? (
          <p>لا توجد منتجات مطابقة.</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div className="product-item" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

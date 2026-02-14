export const dynamic = "force-dynamic";

import ProductCard from "../productCard/page";

export const metadata = {
  title: "جميع المنتجات | فرصتي",
  description: "استعرض جميع منتجات متجر فرصتي للملابس الطبية والمدرسية.",
  openGraph: {
    title: "جميع المنتجات | فرصتي",
    description:
      "استعرض جميع منتجات متجر فرصتي للملابس الطبية والمدرسية.",
    url: "https://fursatiuniforms.com/products",
    siteName: "فرصتي",
    locale: "ar",
    type: "website",
  },
};

async function getProducts() {
  try {
    const consumerKey = process.env.WOO_CONSUMER_KEY;
    const secretKey = process.env.WOO_SECRET_KEY;

    const url = `https://furssati.io/wp-json/wc/v3/products?status=publish&per_page=100`;
    const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString("base64");

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("حدث خطأ أثناء جلب المنتجات");

    return await res.json();
  } catch (error) {
    console.error("خطأ في جلب المنتجات:", error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "جميع المنتجات",
            description:
              "استعرض جميع منتجات متجر فرصتي للملابس الطبية والمدرسية.",
            url: "https://fursatiuniforms.com/products",
            inLanguage: "ar",
            mainEntity: products.map((p) => ({
              "@type": "Product",
              name: p.name,
              image: p.images?.[0]?.src || "",
              url: `https://fursatiuniforms.com/product/${p.slug}`,
              offers: {
                "@type": "Offer",
                price: p.price,
                priceCurrency: "SAR",
                availability: "https://schema.org/InStock",
              },
            })),
          }),
        }}
      />

      <div style={styles.container}>
        <h1 style={styles.title}>جميع المنتجات</h1>

        <div style={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    textAlign: "center",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  title: {
    fontSize: "25px",
    padding: "10px",
  },
};

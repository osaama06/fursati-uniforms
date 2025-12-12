// components/ProductSlider/page.jsx
import Link from "next/link";
import ProductCard from "@/app/productCard/page";
import "@/styles/components/ProductSlider.css";

export default function ProductSlider({ category, products }) {
  if (!products?.length) return null;

  return (
    <section className="slider-container">

      <h2 className="slider-title">
        <Link href={`/${category.slug}`} className="slider-link">
          {category.name}
        </Link>



      </h2>


      <div className="slider">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="prod-card" />
        ))}
      </div>
    </section>
  );
}

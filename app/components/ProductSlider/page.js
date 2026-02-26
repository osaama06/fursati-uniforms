import Link from "next/link";
import ProductCard from "@/app/productCard/page";
import "@/styles/components/ProductSlider.css";

export default function ProductSlider({ category, products }) {
  if (!products?.length) return null;

  // تحديد الرابط: إذا كان تصنيفاً حقيقياً نستخدم الـ slug، وإذا كان "الأكثر مبيعاً" نوجهه لصفحة المتجر
  const categoryLink = category.description ? `/${category.slug}` : "/shop";

  return (
    <section className="slider-container">
      {/* الرأس الجديد للسلايدر */}
      <div className="slider-header">
        <h2 className="slider-title">
          {category.name}
        </h2>
        
        <Link href={categoryLink} className="view-all-link">
          <span>عرض الكل</span>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" /> {/* سهم يتجه لليسار بما أن اللغة عربية */}
          </svg>
        </Link>
      </div>

      <div className="slider">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="prod-card" />
        ))}
      </div>
    </section>
  );
}
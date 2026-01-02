import "@/styles/components/product-skeleton.css";

export default function Loading() {
  return (
    <div className="skeleton-wrapper" dir="rtl">
      {/* Breadcrumb Skeleton */}
      <div className="skeleton-breadcrumb pulse"></div>

      <div className="skeleton-container">
        {/* 1. قسم الصور (يمين - Amazon Style) */}
        <div className="skeleton-image-section">
          <div className="skeleton-thumbs-container">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-thumb pulse"></div>
            ))}
          </div>
          <div className="skeleton-main-image pulse"></div>
        </div>

        {/* 2. قسم التفاصيل (وسط) */}
        <div className="skeleton-details-section">
          <div className="skeleton-title pulse"></div>
          <div className="skeleton-rating pulse"></div>
          <div className="skeleton-price-section pulse"></div>

          <div className="skeleton-description">
            <div className="skeleton-line pulse"></div>
            <div className="skeleton-line pulse"></div>
            <div className="skeleton-line short pulse"></div>
          </div>

          <div className="skeleton-options">
            <div className="skeleton-label pulse"></div>
            <div className="skeleton-swatches">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-chip pulse"></div>
              ))}
            </div>
          </div>

          <div className="skeleton-specs pulse"></div>
        </div>

        {/* 3. صندوق الشراء (يسار - Checkout Style) */}
        <div className="skeleton-buybox pulse">
          <div className="skeleton-buybox-price pulse"></div>
          <div className="skeleton-buybox-stock pulse"></div>
          <div className="skeleton-buybox-button pulse"></div>
        </div>
      </div>
    </div>
  );
}
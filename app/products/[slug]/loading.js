import "@/styles/components/product-skeleton.css";

export default function Loading() {
  return (
    <div className="skeleton-wrapper" dir="rtl">
      <div className="skeleton-container">
        {/* قسم الصور (يمين) */}
        <div className="skeleton-image-side">
          <div className="skeleton-main-image pulse"></div>
          <div className="skeleton-thumbs">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-thumb pulse"></div>
            ))}
          </div>
        </div>

        {/* قسم التفاصيل (يسار) */}
        <div className="skeleton-details-side">
          <div className="skeleton-title pulse"></div>
          <div className="skeleton-price pulse"></div>
          <div className="skeleton-description">
            <div className="skeleton-line pulse"></div>
            <div className="skeleton-line pulse"></div>
            <div className="skeleton-line short pulse"></div>
          </div>
          <div className="skeleton-options">
            <div className="skeleton-label pulse"></div>
            <div className="skeleton-swatches">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-circle pulse"></div>
              ))}
            </div>
          </div>
          <div className="skeleton-button pulse"></div>
        </div>
      </div>
    </div>
  );
}
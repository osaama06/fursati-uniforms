'use client';
import Image from "next/image";
import { useState, useEffect, useCallback, memo } from "react";
import { IoBagAddOutline } from "react-icons/io5";
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import '@/styles/components/ProductCard.css';

// Memoize component for better performance
const DynamicProductCard = memo(function DynamicProductCard({ product }) {
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [liked, setLiked] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  // فحص وجود المقاسات - مع حماية من null
  const hasSizes = product?.attributes?.some(attr =>
    attr.name.toLowerCase().includes("size") || attr.name === "المقاس"
  ) || false;

  const sizes = hasSizes
    ? product.attributes.find(attr =>
        attr.name.toLowerCase().includes("size") || attr.name === "المقاس"
      )?.options || []
    : [];

  // حساب نسبة الخصم - memoized
  const calculateDiscount = useCallback(() => {
    if (product?.regular_price && product?.sale_price) {
      const regular = parseFloat(product.regular_price);
      const sale = parseFloat(product.sale_price);
      return Math.round(((regular - sale) / regular) * 100);
    }
    return 0;
  }, [product?.regular_price, product?.sale_price]);

  const discount = calculateDiscount();
  const finalPrice = product?.sale_price || product?.price || product?.regular_price;
  const originalPrice = product?.regular_price;

  // بيانات التقييم من API
  const averageRating = product?.average_rating || 0;
  const totalReviews = product?.rating_count || 0;

  // فحص إذا كان الجهاز موبايل
  const checkIsMobile = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  }, []);

  // جميع الـ Callbacks يجب أن تكون هنا قبل أي conditional returns
  const handleModalClose = useCallback(() => {
    setShowMobileModal(false);
    setShowDesktopModal(false);
    setShowSizeError(false);
    setSelectedSize('');
  }, []);

  const handleSizeSelect = useCallback((size, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedSize(size);
    setShowSizeError(false);
  }, []);

  const handleAddToCart = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (hasSizes && !selectedSize) {
      setShowSizeError(true);
      return;
    }

    setShowSizeError(false);
    addToCart({
      id: product?.id,
      name: product?.name,
      price: finalPrice,
      image: product?.images?.[0]?.src,
      size: selectedSize || null,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 3000);

    if (showMobileModal || showDesktopModal) {
      handleModalClose();
    }
  }, [hasSizes, selectedSize, addToCart, product, finalPrice, showMobileModal, showDesktopModal, handleModalClose]);

  const handleQuickAdd = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const isMobile = checkIsMobile();

    if (hasSizes && mounted) {
      if (isMobile) {
        setShowMobileModal(true);
      } else {
        setShowDesktopModal(true);
      }
      return;
    }

    handleAddToCart(e);
  }, [hasSizes, mounted, handleAddToCart, checkIsMobile]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleModalClose();
    }
  }, [handleModalClose]);

  const handleLike = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setLiked(!liked);
  }, [liked]);

  const handleCardClick = useCallback(() => {
    if (showMobileModal || showDesktopModal) {
      return;
    }
    router.push(`/products/${product?.slug}`);
  }, [router, product?.slug, showMobileModal, showDesktopModal]);

  const handleModalProductView = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    handleModalClose();
    router.push(`/products/${product?.slug}`);
  }, [router, product?.slug, handleModalClose]);

  // التأكد من تحميل المكون
  useEffect(() => {
    setMounted(true);
  }, []);

  // إصلاح منع التمرير في الخلفية عند فتح النافذة
  useEffect(() => {
    const handleModalOpen = (isOpen) => {
      if (typeof document !== 'undefined') {
        if (isOpen) {
          const scrollY = window.scrollY;
          document.body.style.position = 'fixed';
          document.body.style.top = `-${scrollY}px`;
          document.body.style.left = '0';
          document.body.style.right = '0';
          document.body.classList.add('modal-open');
        } else {
          const scrollY = document.body.style.top;
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.left = '';
          document.body.style.right = '';
          document.body.classList.remove('modal-open');
          if (scrollY) {
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
          }
        }
      }
    };

    const isModalOpen = showMobileModal || showDesktopModal;
    handleModalOpen(isModalOpen);

    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.classList.remove('modal-open');
      }
    };
  }, [showMobileModal, showDesktopModal]);

  // منع الإغلاق بالضغط على Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleModalClose();
      }
    };

    if (showMobileModal || showDesktopModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showMobileModal, showDesktopModal, handleModalClose]);

  // Early return بعد جميع الـ Hooks
  if (!product) {
    return <div className="no-product">لا توجد بيانات للمنتج</div>;
  }

  // عدم عرض المكون قبل التحميل الكامل للتجنب SSR issues
  if (!mounted) {
    return (
      <div className="dynamic-product-card skeleton-card" aria-busy="true" aria-live="polite">
        {/* الصورة skeleton */}
        <div className="image-container">
          <div className="skeleton-shimmer" role="img" aria-label="جاري تحميل صورة المنتج"></div>
        </div>
        
        <div className="card-content">
          {/* التقييمات والزر skeleton */}
          <div className="rating-section">
            <div className="skeleton-box" style={{ width: '100px', height: '20px' }} aria-label="جاري تحميل التقييم"></div>
            <div className="skeleton-circle" style={{ width: '40px', height: '40px' }} aria-label="جاري تحميل الزر"></div>
          </div>
          
          {/* اسم المنتج skeleton */}
          <div className="skeleton-box" style={{ width: '100%', height: '20px', marginBottom: '8px' }} aria-label="جاري تحميل اسم المنتج"></div>
          <div className="skeleton-box" style={{ width: '70%', height: '20px', marginBottom: '12px' }}></div>
          
          {/* السعر skeleton */}
          <div className="price-section">
            <div className="price-container">
              <div className="skeleton-box" style={{ width: '120px', height: '28px' }} aria-label="جاري تحميل السعر"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Product image with proper alt text
  const productImageAlt = product?.name ? `صورة ${product.name}` : 'صورة المنتج';
  const productImageSrc = product?.images?.[0]?.src || "/placeholder.jpg";

  return (
    <>
      <article
        className="dynamic-product-card clickable-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label={`عرض تفاصيل ${product.name}`}
      >
        {/* شارة الخصم */}
        {discount > 0 && (
          <div className="discount-badge" aria-label={`خصم ${discount} بالمئة`}>
            -{discount}%
          </div>
        )}

        {/* حاوية الصورة */}
        <div className="image-container">
          {/* الصورة الرئيسية */}
          <div className="image-wrapper">
            <Image
              src={productImageSrc}
              alt={productImageAlt}
              width={400}
              height={400}
              className="product-image"
              loading="lazy"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 260px"
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>
        </div>

        {/* محتوى البطاقة */}
        <div className="card-content">
          {/* التقييمات والزر المصغر */}
          <div className="rating-section">
            <div className="rating-info">
              <div className="stars" aria-label={`التقييم ${averageRating} من 5 نجوم`}>
                <span aria-hidden="true">★</span>
                <span className="rating-value">{averageRating}</span>
                <span className="review-count">({totalReviews})</span>
              </div>
            </div>
            <button
              className="adding"
              onClick={handleQuickAdd}
              title="إضافة سريعة للسلة"
              aria-label={`إضافة ${product.name} إلى السلة بسرعة`}
              type="button"
            >
              <IoBagAddOutline aria-hidden="true" />
            </button>
          </div>

          {/* اسم المنتج */}
          <h3 className="product-name">{product.name}</h3>

          {/* الأسعار */}
          <div className="price-section">
            <div className="price-container">
              <div className="current-price">
                <span className="currency" aria-label="ريال سعودي">
                  {finalPrice}{' '}
                  <Image
                    src="/sar.webp"
                    alt=""
                    width={20}
                    height={20}
                    className="sarsymbol-img"
                    loading="lazy"
                    aria-hidden="true"
                  />
                </span>
              </div>
              {originalPrice && product.sale_price && (
                <div className="original-price" aria-label={`السعر الأصلي ${originalPrice} ريال`}>
                  {originalPrice} &#xFDFC;
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* النافذة المنبثقة للموبايل */}
      {showMobileModal && (
        <div className="mobile-modal-overlay" onClick={handleOverlayClick} role="presentation">
          <div
            className="mobile-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-modal-title"
            aria-describedby="mobile-modal-description"
          >
            {/* مقبض الإغلاق */}
            <button 
              className="modal-handle" 
              onClick={handleModalClose}
              aria-label="إغلاق النافذة"
              type="button"
            ></button>

            {/* محتوى النافذة */}
            <div className="modal-content">
              {/* صورة المنتج */}
              <div className="modal-image">
                <Image
                  src={productImageSrc}
                  alt={productImageAlt}
                  width={120}
                  height={120}
                  className="modal-product-image"
                  loading="eager"
                  sizes="120px"
                  quality={85}
                />
              </div>

              {/* معلومات المنتج */}
              <div className="modal-info">
                <h3 id="mobile-modal-title" className="modal-product-name">{product.name}</h3>
                <p id="mobile-modal-description" className="sr-only">اختر المقاس وأضف المنتج إلى السلة</p>

                {/* السعر */}
                <div className="modal-price">
                  <span className="modal-current-price" aria-label={`السعر ${finalPrice} ريال سعودي`}>
                    {finalPrice}{' '}
                    <span className="modal-currency">
                      <Image
                        src="/sar.webp"
                        alt=""
                        width={20}
                        height={20}
                        className="sarsymbol-img"
                        loading="eager"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  {originalPrice && product.sale_price && (
                    <span className="modal-original-price" aria-label={`السعر الأصلي ${originalPrice} ريال`}>
                      {originalPrice}
                      <Image
                        src="/sar.webp"
                        alt=""
                        width={20}
                        height={20}
                        className="sarsymbol-img"
                        loading="eager"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </div>

                {/* المقاسات */}
                {hasSizes && (
                  <div className="modal-sizes-section">
                    <div className="modal-sizes-label">
                      <span id="size-label">اختر المقاس</span>
                      {selectedSize && <span className="modal-selected-size" aria-live="polite">({selectedSize})</span>}
                    </div>
                    <div className="modal-sizes-grid" role="group" aria-labelledby="size-label">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={(e) => handleSizeSelect(size, e)}
                          className={`modal-size-circle ${selectedSize === size ? 'selected' : ''}`}
                          aria-pressed={selectedSize === size}
                          aria-label={`المقاس ${size}`}
                          type="button"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {showSizeError && (
                      <p className="modal-size-error" role="alert" aria-live="assertive">⚠️ يرجى اختيار المقاس</p>
                    )}
                  </div>
                )}

                {/* أزرار التحكم */}
                <div className="modal-actions">
                  <button
                    className={`modal-add-to-cart-btn ${added ? 'added' : ''} ${(hasSizes && !selectedSize) ? 'disabled' : ''}`}
                    onClick={handleAddToCart}
                    disabled={hasSizes && !selectedSize}
                    aria-describedby={showSizeError ? 'modal-size-error' : undefined}
                    aria-label={added ? 'تمت إضافة المنتج إلى السلة' : 'أضف المنتج إلى السلة'}
                    type="button"
                  >
                    <IoBagAddOutline className="modal-cart-icon" aria-hidden="true" />
                    <span>{added ? 'تمت الإضافة ✨' : 'أضف إلى السلة'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* النافذة الجانبية للديسكتوب */}
      {showDesktopModal && (
        <div className="desktop-modal-overlay" onClick={handleOverlayClick} role="presentation">
          <div
            className="desktop-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="desktop-modal-title"
            aria-describedby="desktop-modal-description"
          >
            {/* زر الإغلاق */}
            <button
              className="desktop-modal-close"
              onClick={handleModalClose}
              aria-label="إغلاق النافذة"
              type="button"
            >
              ×
            </button>

            {/* محتوى النافذة */}
            <div className="desktop-modal-content">
              {/* صورة المنتج */}
              <div className="desktop-modal-image">
                <Image
                  src={productImageSrc}
                  alt={productImageAlt}
                  width={200}
                  height={200}
                  className="desktop-modal-product-image"
                  loading="eager"
                  sizes="200px"
                  quality={85}
                />
              </div>

              {/* معلومات المنتج */}
              <div className="desktop-modal-info">
                <h3 id="desktop-modal-title" className="desktop-modal-product-name">{product.name}</h3>
                <p id="desktop-modal-description" className="sr-only">اختر المقاس وأضف المنتج إلى السلة</p>

                {/* التقييمات */}
                <div className="desktop-modal-rating" aria-label={`التقييم ${averageRating} من 5 نجوم بناءً على ${totalReviews} تقييم`}>
                  <div className="stars">
                    <span aria-hidden="true">★</span>
                    <span className="rating-value">{averageRating}</span>
                  </div>
                  <span className="review-count">({totalReviews} تقييم)</span>
                </div>

                {/* السعر */}
                <div className="desktop-modal-price">
                  <span className="desktop-modal-current-price" aria-label={`السعر ${finalPrice} ريال سعودي`}>
                    {finalPrice}{' '}
                    <span className="desktop-modal-currency">
                      <Image
                        src="/sar.webp"
                        alt=""
                        width={20}
                        height={20}
                        className="sarsymbol-img"
                        loading="eager"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  {originalPrice && product.sale_price && (
                    <span className="desktop-modal-original-price" aria-label={`السعر الأصلي ${originalPrice} ريال`}>
                      {originalPrice}
                      <Image
                        src="/sar.webp"
                        alt=""
                        width={20}
                        height={20}
                        className="sarsymbol-img"
                        loading="eager"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </div>

                {/* المقاسات */}
                {hasSizes && (
                  <div className="desktop-modal-sizes-section">
                    <div className="desktop-modal-sizes-label">
                      <span id="desktop-size-label">اختر المقاس</span>
                      {selectedSize && <span className="desktop-modal-selected-size" aria-live="polite">({selectedSize})</span>}
                    </div>
                    <div className="desktop-modal-sizes-grid" role="group" aria-labelledby="desktop-size-label">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={(e) => handleSizeSelect(size, e)}
                          className={`desktop-modal-size-circle ${selectedSize === size ? 'selected' : ''}`}
                          aria-pressed={selectedSize === size}
                          aria-label={`المقاس ${size}`}
                          type="button"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {showSizeError && (
                      <p className="desktop-modal-size-error" role="alert" aria-live="assertive">⚠️ يرجى اختيار المقاس</p>
                    )}
                  </div>
                )}

                {/* أزرار التحكم */}
                <div className="desktop-modal-actions">
                  <button
                    className={`desktop-modal-add-to-cart-btn ${added ? 'added' : ''} ${(hasSizes && !selectedSize) ? 'disabled' : ''}`}
                    onClick={handleAddToCart}
                    disabled={hasSizes && !selectedSize}
                    aria-describedby={showSizeError ? 'desktop-modal-size-error' : undefined}
                    aria-label={added ? 'تمت إضافة المنتج إلى السلة' : 'أضف المنتج إلى السلة'}
                    type="button"
                  >
                    <IoBagAddOutline className="desktop-modal-cart-icon" aria-hidden="true" />
                    <span>{added ? 'تمت الإضافة ✨' : 'أضف إلى السلة'}</span>
                  </button>
                  <button
                    className="desktop-modal-view-product"
                    onClick={handleModalProductView}
                    aria-label={`عرض تفاصيل ${product.name}`}
                    type="button"
                  >
                    عرض تفاصيل المنتج
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

// Add display name for debugging
DynamicProductCard.displayName = 'DynamicProductCard';

export default DynamicProductCard;
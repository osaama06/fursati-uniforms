'use client';
import Image from "next/image";
import { useState, useEffect, useCallback, memo } from "react";
import { IoBagAddOutline } from "react-icons/io5";
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import '@/styles/components/ProductCard.css';

const DynamicProductCard = memo(function DynamicProductCard({ product }) {
  const [added, setAdded] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [showAttrError, setShowAttrError] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  // ─── كل الـ variation attributes (مو بس size) ───────────────────────────
  const variationAttributes = (product?.attributes || [])
    .filter((attr) => attr?.variation && Array.isArray(attr.options) && attr.options.length > 0);

  const hasAttributes = variationAttributes.length > 0;

  // هل كل الـ attributes اتحددت؟
  const allSelected = variationAttributes.every((attr) => selectedAttributes[attr.name]);

  const calculateDiscount = useCallback(() => {
    if (product?.regular_price && product?.sale_price) {
      const regular = parseFloat(product.regular_price);
      const sale    = parseFloat(product.sale_price);
      return Math.round(((regular - sale) / regular) * 100);
    }
    return 0;
  }, [product?.regular_price, product?.sale_price]);

  const discount      = calculateDiscount();
  const finalPrice    = product?.sale_price || product?.price || product?.regular_price;
  const originalPrice = product?.regular_price;
  const averageRating = product?.average_rating || 0;
  const totalReviews  = product?.rating_count   || 0;
  const productSlug   = decodeURIComponent(product?.slug || '');

  const handleModalClose = useCallback(() => {
    setShowMobileModal(false);
    setShowDesktopModal(false);
    setShowAttrError(false);
    setSelectedAttributes({});
  }, []);

  const handleAttrSelect = useCallback((attrName, value, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setSelectedAttributes((prev) => ({ ...prev, [attrName]: value }));
    setShowAttrError(false);
  }, []);

  const handleAddToCart = useCallback((e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }

    if (hasAttributes && !allSelected) {
      setShowAttrError(true);
      return;
    }

    setShowAttrError(false);
    addToCart({
      id:                 product?.id,
      productId:          product?.id,
      name:               product?.name,
      price:              finalPrice,
      image:              product?.images?.[0]?.src,
      slug:               productSlug,
      selectedAttributes: hasAttributes ? selectedAttributes : {},
      customFields:       {},
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
    if (showMobileModal || showDesktopModal) handleModalClose();
  }, [hasAttributes, allSelected, selectedAttributes, addToCart, product, finalPrice, productSlug, showMobileModal, showDesktopModal, handleModalClose]);

  const handleQuickAdd = useCallback((e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }

    if (hasAttributes) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (isMobile) setShowMobileModal(true);
      else          setShowDesktopModal(true);
      return;
    }
    handleAddToCart(e);
  }, [hasAttributes, handleAddToCart]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleModalClose();
  }, [handleModalClose]);

  const handleCardClick = useCallback(() => {
    if (showMobileModal || showDesktopModal) return;
    router.push(`/products/${productSlug}`);
  }, [router, productSlug, showMobileModal, showDesktopModal]);

  const handleModalProductView = useCallback((e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    handleModalClose();
    router.push(`/products/${productSlug}`);
  }, [router, productSlug, handleModalClose]);

  useEffect(() => {
    const handleModalOpen = (isOpen) => {
      if (typeof window === 'undefined') return;
      requestAnimationFrame(() => {
        if (isOpen) {
          const scrollY = window.scrollY;
          document.body.style.position = 'fixed';
          document.body.style.top      = `-${scrollY}px`;
          document.body.style.left     = '0';
          document.body.style.right    = '0';
          document.body.classList.add('modal-open');
        } else {
          const scrollY    = document.body.style.top;
          const scrollValue = scrollY ? parseInt(scrollY || '0') * -1 : 0;
          document.body.style.position = '';
          document.body.style.top      = '';
          document.body.style.left     = '';
          document.body.style.right    = '';
          document.body.classList.remove('modal-open');
          if (scrollValue !== 0) window.scrollTo(0, scrollValue);
        }
      });
    };

    handleModalOpen(showMobileModal || showDesktopModal);

    return () => {
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => {
          document.body.style.position = '';
          document.body.style.top      = '';
          document.body.style.left     = '';
          document.body.style.right    = '';
          document.body.classList.remove('modal-open');
        });
      }
    };
  }, [showMobileModal, showDesktopModal]);

  useEffect(() => {
    const handleEscapeKey = (e) => { if (e.key === 'Escape') handleModalClose(); };
    if (showMobileModal || showDesktopModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showMobileModal, showDesktopModal, handleModalClose]);

  if (!product) return <div className="no-product">لا توجد بيانات للمنتج</div>;

  const productImageAlt = product?.name ? `صورة ${product.name}` : 'صورة المنتج';
  const productImageSrc = product?.images?.[0]?.src || "/placeholder.jpg";

  // ─── مكون الـ attributes يُستخدم في المودالين ────────────────────────────
  const AttributesSelector = () => (
    <div style={{ marginTop: '12px' }}>
      {variationAttributes.map((attr) => (
        <div key={attr.name} style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: '#444' }}>
            {attr.name}
            {selectedAttributes[attr.name] && (
              <span style={{ fontWeight: '400', color: '#00c2cb', marginRight: '6px' }}>
                ({selectedAttributes[attr.name]})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {attr.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={(e) => handleAttrSelect(attr.name, option, e)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${selectedAttributes[attr.name] === option ? '#00c2cb' : '#e0e0e0'}`,
                  background: selectedAttributes[attr.name] === option ? '#f0fbfc' : '#fff',
                  color: selectedAttributes[attr.name] === option ? '#00c2cb' : '#555',
                  fontWeight: selectedAttributes[attr.name] === option ? '700' : '400',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: '0.15s',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
      {showAttrError && (
        <p style={{ color: '#e53e3e', fontSize: '0.82rem', marginTop: '4px' }} role="alert">
          ⚠️ يرجى اختيار جميع الخيارات
        </p>
      )}
    </div>
  );

  return (
    <>
      <article
        className="dynamic-product-card clickable-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); }
        }}
        aria-label={`عرض تفاصيل ${product.name}`}
      >
        {discount > 0 && (
          <div className="discount-badge" aria-label={`خصم ${discount} بالمئة`}>-{discount}%</div>
        )}

        <div className="image-container">
          <div className="image-wrapper">
            <Image
              src={productImageSrc} alt={productImageAlt}
              width={400} height={400} className="product-image"
              loading="lazy" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 260px" quality={85}
            />
          </div>
        </div>

        <div className="card-content">
          <div className="rating-section">
            <div className="rating-info">
              <div className="stars" aria-label={`التقييم ${averageRating} من 5 نجوم`}>
                <span aria-hidden="true">★</span>
                <span className="rating-value">{averageRating}</span>
                <span className="review-count">({totalReviews})</span>
              </div>
            </div>
            <button
              className="adding" onClick={handleQuickAdd} type="button"
              title="إضافة سريعة للسلة"
              aria-label={`إضافة ${product.name} إلى السلة بسرعة`}
            >
              <IoBagAddOutline aria-hidden="true" />
            </button>
          </div>

          <h3 className="product-name">{product.name}</h3>

          <div className="price-section">
            <div className="price-container">
              <div className="current-price">
                <span className="currency" aria-label="ريال سعودي">
                  {finalPrice}{' '}
                  <Image src="/sar.webp" alt="" width={20} height={20} className="sarsymbol-img" loading="lazy" aria-hidden="true" />
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

      {/* ─── موبايل modal ──────────────────────────────────────────────────── */}
      {showMobileModal && (
        <div className="mobile-modal-overlay" onClick={handleOverlayClick} role="presentation">
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="mobile-modal-title">
            <button className="modal-handle" onClick={handleModalClose} aria-label="إغلاق النافذة" type="button" />

            <div className="modal-content">
              <div className="modal-image">
                <Image src={productImageSrc} alt={productImageAlt}
                  width={120} height={120} className="modal-product-image" loading="eager" sizes="120px" quality={85} />
              </div>

              <div className="modal-info">
                <h3 id="mobile-modal-title" className="modal-product-name">{product.name}</h3>

                <div className="modal-price">
                  <span className="modal-current-price">
                    {finalPrice}{' '}
                    <span className="modal-currency">
                      <Image src="/sar.webp" alt="" width={20} height={20} className="sarsymbol-img" loading="eager" aria-hidden="true" />
                    </span>
                  </span>
                  {originalPrice && product.sale_price && (
                    <span className="modal-original-price">
                      {originalPrice}
                      <Image src="/sar.webp" alt="" width={20} height={20} className="sarsymbol-img" loading="eager" aria-hidden="true" />
                    </span>
                  )}
                </div>

                {hasAttributes && <AttributesSelector />}

                <div className="modal-actions">
                  <button
                    className={`modal-add-to-cart-btn ${added ? 'added' : ''} ${hasAttributes && !allSelected ? 'disabled' : ''}`}
                    onClick={handleAddToCart}
                    disabled={hasAttributes && !allSelected}
                    type="button"
                    aria-label={added ? 'تمت إضافة المنتج إلى السلة' : 'أضف المنتج إلى السلة'}
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

      {/* ─── ديسكتوب modal ─────────────────────────────────────────────────── */}
      {showDesktopModal && (
        <div className="desktop-modal-overlay" onClick={handleOverlayClick} role="presentation">
          <div className="desktop-modal" onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-labelledby="desktop-modal-title">
            <button className="desktop-modal-close" onClick={handleModalClose} aria-label="إغلاق النافذة" type="button">×</button>

            <div className="desktop-modal-content">
              <div className="desktop-modal-image">
                <Image src={productImageSrc} alt={productImageAlt}
                  width={200} height={200} className="desktop-modal-product-image" loading="eager" sizes="200px" quality={85} />
              </div>

              <div className="desktop-modal-info">
                <h3 id="desktop-modal-title" className="desktop-modal-product-name">{product.name}</h3>

                <div className="desktop-modal-rating">
                  <div className="stars">
                    <span aria-hidden="true">★</span>
                    <span className="rating-value">{averageRating}</span>
                  </div>
                  <span className="review-count">({totalReviews} تقييم)</span>
                </div>

                <div className="desktop-modal-price">
                  <span className="desktop-modal-current-price">
                    {finalPrice}{' '}
                    <span className="desktop-modal-currency">
                      <Image src="/sar.webp" alt="" width={20} height={20} className="sarsymbol-img" loading="eager" aria-hidden="true" />
                    </span>
                  </span>
                  {originalPrice && product.sale_price && (
                    <span className="desktop-modal-original-price">
                      {originalPrice}
                      <Image src="/sar.webp" alt="" width={20} height={20} className="sarsymbol-img" loading="eager" aria-hidden="true" />
                    </span>
                  )}
                </div>

                {hasAttributes && <AttributesSelector />}

                <div className="desktop-modal-actions">
                  <button
                    className={`desktop-modal-add-to-cart-btn ${added ? 'added' : ''} ${hasAttributes && !allSelected ? 'disabled' : ''}`}
                    onClick={handleAddToCart}
                    disabled={hasAttributes && !allSelected}
                    type="button"
                    aria-label={added ? 'تمت إضافة المنتج إلى السلة' : 'أضف المنتج إلى السلة'}
                  >
                    <IoBagAddOutline className="desktop-modal-cart-icon" aria-hidden="true" />
                    <span>{added ? 'تمت الإضافة ✨' : 'أضف إلى السلة'}</span>
                  </button>
                  <button
                    className="desktop-modal-view-product"
                    onClick={handleModalProductView}
                    type="button"
                    aria-label={`عرض تفاصيل ${product.name}`}
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

DynamicProductCard.displayName = 'DynamicProductCard';
export default DynamicProductCard;
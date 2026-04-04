'use client';
import Image from "next/image";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { IoBagAddOutline } from "react-icons/io5";
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import '@/styles/components/ProductCard.css';

const DynamicProductCard = memo(function DynamicProductCard({ product }) {
  const [added, setAdded] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [showAttrError, setShowAttrError] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  // ─── Variation attributes ─────────────────────────────────────────────────
  const variationAttributes = (product?.attributes || [])
    .filter((attr) => attr?.variation && Array.isArray(attr.options) && attr.options.length > 0);

  const hasAttributes = variationAttributes.length > 0;
  const allAttributesSelected = variationAttributes.every((attr) => selectedAttributes[attr.name]);

  // ─── Custom fields من meta_data ───────────────────────────────────────────
const customFields = useMemo(() => {
  const metaValue = product?.meta_data?.find(
    (item) => item.key === 'custom_product_fields_json'
  )?.value;
  
  console.log('meta_data:', product?.meta_data);
  console.log('metaValue:', metaValue);
  
  if (!metaValue || typeof metaValue !== 'string' || metaValue.trim() === '') return [];
  try {
    const parsed = JSON.parse(metaValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}, [product?.meta_data]);

  const hasCustomFields = customFields.length > 0;

  // هل كل الـ required custom fields اتعبت؟
  const allCustomFieldsFilled = customFields.every((field) => {
    if (!field.field_required) return true;
    const val = customFieldValues[field.field_key];
    if (field.field_type === 'checkbox') return Array.isArray(val) && val.length > 0;
    return String(val || '').trim() !== '';
  });

  const canAddToCart = (!hasAttributes || allAttributesSelected) && allCustomFieldsFilled;

  // ─── السعر الإضافي من custom fields ──────────────────────────────────────
  const extraPrice = useMemo(() => {
    return customFields.reduce((total, field) => {
      const options = Array.isArray(field.field_options) ? field.field_options : [];
      if (field.field_type === 'radio') {
        const selected = customFieldValues[field.field_key];
        if (!selected) return total;
        const match = options.find((opt) => opt.label === selected);
        return total + (Number(match?.price) || 0);
      }
      if (field.field_type === 'checkbox') {
        const selected = customFieldValues[field.field_key];
        if (!Array.isArray(selected) || selected.length === 0) return total;
        return total + selected.reduce((sum, label) => {
          const match = options.find((opt) => opt.label === label);
          return sum + (Number(match?.price) || 0);
        }, 0);
      }
      return total;
    }, 0);
  }, [customFields, customFieldValues]);

  
  const calculateDiscount = useCallback(() => {
    if (product?.regular_price && product?.sale_price) {
      const regular = parseFloat(product.regular_price);
      const sale    = parseFloat(product.sale_price);
      return Math.round(((regular - sale) / regular) * 100);
    }
    return 0;
  }, [product?.regular_price, product?.sale_price]);

  const discount      = calculateDiscount();
  const basePrice     = parseFloat(product?.sale_price || product?.price || product?.regular_price || 0);
  const finalPrice    = (basePrice + extraPrice).toFixed(2);
  const originalPrice = product?.regular_price;
  const averageRating = product?.average_rating || 0;
  const totalReviews  = product?.rating_count   || 0;
  const productSlug   = decodeURIComponent(product?.slug || '');

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleModalClose = useCallback(() => {
    setShowMobileModal(false);
    setShowDesktopModal(false);
    setShowAttrError(false);
    setSelectedAttributes({});
    setCustomFieldValues({});
  }, []);

  const handleAttrSelect = useCallback((attrName, value, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setSelectedAttributes((prev) => ({ ...prev, [attrName]: value }));
    setShowAttrError(false);
  }, []);

  const handleCustomFieldChange = useCallback((key, value) => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCheckboxChange = useCallback((key, label) => {
    setCustomFieldValues((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const exists  = current.includes(label);
      return { ...prev, [key]: exists ? current.filter((l) => l !== label) : [...current, label] };
    });
  }, []);

  const handleAddToCart = useCallback((e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!canAddToCart) { setShowAttrError(true); return; }

    // بناء الـ customFields payload
    const customFieldsWithLabels = {};
    customFields.forEach((field) => {
      const value   = customFieldValues[field.field_key];
      const options = Array.isArray(field.field_options) ? field.field_options : [];
      if (field.field_type === 'checkbox') {
        if (!Array.isArray(value) || value.length === 0) return;
        const totalPrice = value.reduce((sum, label) => {
          const match = options.find((opt) => opt.label === label);
          return sum + (Number(match?.price) || 0);
        }, 0);
        customFieldsWithLabels[field.field_key] = { label: field.field_label, value: value.join(' / '), price: totalPrice };
        return;
      }
      if (value !== undefined && String(value).trim() !== '') {
        const entry = { label: field.field_label, value: String(value) };
        if (field.field_type === 'radio') {
          const match = options.find((opt) => (opt.label || opt) === value);
          entry.price = Number(match?.price) || 0;
        }
        customFieldsWithLabels[field.field_key] = entry;
      }
    });

    addToCart({
      id:                 product?.id,
      productId:          product?.id,
      name:               product?.name,
      price:              finalPrice,
      image:              product?.images?.[0]?.src,
      slug:               productSlug,
      selectedAttributes: hasAttributes ? selectedAttributes : {},
      customFields:       customFieldsWithLabels,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
    if (showMobileModal || showDesktopModal) handleModalClose();
  }, [canAddToCart, customFields, customFieldValues, addToCart, product, finalPrice, productSlug, hasAttributes, selectedAttributes, showMobileModal, showDesktopModal, handleModalClose]);

  const handleQuickAdd = useCallback((e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (hasAttributes || hasCustomFields) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (isMobile) setShowMobileModal(true);
      else          setShowDesktopModal(true);
      return;
    }
    handleAddToCart(e);
  }, [hasAttributes, hasCustomFields, handleAddToCart]);

  
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
          const scrollY     = document.body.style.top;
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

  // ─── Attributes Selector مشترك ────────────────────────────────────────────
  const AttributesSelector = () => (
    <>
      {variationAttributes.map((attr) => (
        <div key={attr.name} style={{ marginBottom: '12px' }}>
          <div className="modal-sizes-label">
            <span>{attr.name}</span>
            {selectedAttributes[attr.name] && (
              <span className="modal-selected-size">({selectedAttributes[attr.name]})</span>
            )}
          </div>
          <div className="modal-sizes-grid">
            {attr.options.map((option) => (
              <button
                key={option} type="button"
                onClick={(e) => handleAttrSelect(attr.name, option, e)}
                className={`modal-size-circle ${selectedAttributes[attr.name] === option ? 'selected' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );

  // ─── Custom Fields Selector مشترك ─────────────────────────────────────────
  const CustomFieldsSelector = () => (
    <>
      {customFields.map((field) => {
        const value   = customFieldValues[field.field_key] || '';
        const options = Array.isArray(field.field_options) ? field.field_options : [];
        return (
          <div key={field.field_key} style={{ marginBottom: '14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: '#374151' }}>
              {field.field_label}{field.field_required ? ' *' : ''}
            </div>

            {/* buttons */}
            {field.field_type === 'buttons' && (
              <div className="modal-sizes-grid">
                {options.map((option) => (
                  <button key={option} type="button"
                    onClick={(e) => { e.stopPropagation(); handleCustomFieldChange(field.field_key, option); }}
                    className={`modal-size-circle ${value === option ? 'selected' : ''}`}>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* radio */}
            {field.field_type === 'radio' && (
              <div className="modal-sizes-grid">
                {options.map((opt) => {
                  const optLabel = opt.label || opt;
                  const optPrice = Number(opt.price) || 0;
                  return (
                    <button key={optLabel} type="button"
                      onClick={(e) => { e.stopPropagation(); handleCustomFieldChange(field.field_key, optLabel); }}
                      className={`modal-size-circle ${value === optLabel ? 'selected' : ''}`}
                      style={{ width: 'auto', padding: '6px 12px', borderRadius: '10px' }}>
                      {optLabel}{optPrice > 0 ? ` +${optPrice}` : ''}
                    </button>
                  );
                })}
              </div>
            )}

            {/* checkbox */}
            {field.field_type === 'checkbox' && (
              <div className="modal-sizes-grid">
                {options.map((opt) => {
                  const optLabel  = opt.label || opt;
                  const optPrice  = Number(opt.price) || 0;
                  const checked   = Array.isArray(value) && value.includes(optLabel);
                  return (
                    <button key={optLabel} type="button"
                      onClick={(e) => { e.stopPropagation(); handleCheckboxChange(field.field_key, optLabel); }}
                      className={`modal-size-circle ${checked ? 'selected' : ''}`}
                      style={{ width: 'auto', padding: '6px 12px', borderRadius: '10px' }}>
                      {checked ? '✓ ' : ''}{optLabel}{optPrice > 0 ? ` +${optPrice}` : ''}
                    </button>
                  );
                })}
              </div>
            )}

            {/* text / number */}
            {(field.field_type === 'text' || field.field_type === 'number') && (
              <input
                type={field.field_input_type || field.field_type || 'text'}
                placeholder={field.field_placeholder || ''}
                value={value}
                onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            )}

            {/* textarea */}
            {field.field_type === 'textarea' && (
              <textarea
                placeholder={field.field_placeholder || ''}
                value={value}
                onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }}
              />
            )}
          </div>
        );
      })}
    </>
  );

  // ─── محتوى المودال المشترك ────────────────────────────────────────────────
  const ModalBody = () => (
    <>
      <div className="modal-image">
        <Image src={productImageSrc} alt={productImageAlt}
          width={120} height={120} className="modal-product-image" loading="eager" sizes="120px" quality={85} />
      </div>
      <div className="modal-info">
        <h3 className="modal-product-name">{product.name}</h3>
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
        {hasCustomFields && <CustomFieldsSelector />}

        {showAttrError && (
          <p className="modal-size-error" role="alert">⚠️ يرجى تعبئة جميع الحقول المطلوبة</p>
        )}
      </div>
    </>
  );

  return (
    <>
      <article
        className="dynamic-product-card clickable-card"
        onClick={handleCardClick}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
        aria-label={`عرض تفاصيل ${product.name}`}
      >
        {discount > 0 && (
          <div className="discount-badge" aria-label={`خصم ${discount} بالمئة`}>-{discount}%</div>
        )}

        <div className="image-container">
          <div className="image-wrapper">
            <Image src={productImageSrc} alt={productImageAlt}
              width={400} height={400} className="product-image"
              loading="lazy" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 260px" quality={85} />
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
            <button className="adding" onClick={handleQuickAdd} type="button"
              title="إضافة سريعة للسلة" aria-label={`إضافة ${product.name} إلى السلة بسرعة`}>
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
              <ModalBody />
              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button
                  className={`modal-add-to-cart-btn ${added ? 'added' : ''} ${!canAddToCart ? 'disabled' : ''}`}
                  onClick={handleAddToCart} disabled={!canAddToCart} type="button">
                  <IoBagAddOutline className="modal-cart-icon" aria-hidden="true" />
                  <span>{added ? 'تمت الإضافة ✨' : 'أضف إلى السلة'}</span>
                </button>
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
              <ModalBody />
              <div className="desktop-modal-actions">
                <button
                  className={`desktop-modal-add-to-cart-btn ${added ? 'added' : ''} ${!canAddToCart ? 'disabled' : ''}`}
                  onClick={handleAddToCart} disabled={!canAddToCart} type="button">
                  <IoBagAddOutline className="desktop-modal-cart-icon" aria-hidden="true" />
                  <span>{added ? 'تمت الإضافة ✨' : 'أضف إلى السلة'}</span>
                </button>
                <button className="desktop-modal-view-product" onClick={handleModalProductView} type="button">
                  عرض تفاصيل المنتج
                </button>
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
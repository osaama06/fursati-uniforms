'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IoBagAddOutline } from 'react-icons/io5';
import '@/styles/components/ProductCard.css';

export default function ProductModal({ 
  product, 
  show, 
  onClose, 
  isMobile = false 
}) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [showSizeError, setShowSizeError] = useState(false);
  const [added, setAdded] = useState(false);

  const sizes = product.attributes?.find(attr => attr.name === 'المقاس')?.options || [];
  const hasSizes = sizes.length > 0;
  
  const finalPrice = product.sale_price || product.price;
  const originalPrice = product.sale_price ? product.price : null;
  const averageRating = product.average_rating || '0.0';
  const totalReviews = product.rating_count || 0;

  useEffect(() => {
    if (show) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      setSelectedSize(null);
      setShowSizeError(false);
      setAdded(false);
    }
    return () => document.body.classList.remove('modal-open');
  }, [show]);

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setShowSizeError(true);
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images?.[0]?.src,
      size: selectedSize,
      quantity: 1
    };

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.findIndex(item => item.id === product.id && item.size === selectedSize);

    if (existing > -1) {
      cart[existing].quantity += 1;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => onClose(), 1000);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setShowSizeError(false);
  };

  if (!show) return null;

  const overlayClass = isMobile ? 'mobile-modal-overlay' : 'desktop-modal-overlay';
  const modalClass = isMobile ? 'mobile-modal' : 'desktop-modal';

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        {/* Mobile Handle */}
        {isMobile && <div className="modal-handle" onClick={onClose}></div>}
        
        {/* Desktop Close */}
        {!isMobile && (
          <button className="desktop-modal-close" onClick={onClose}>×</button>
        )}

        <div className={isMobile ? 'modal-content' : 'desktop-modal-content'}>
          {/* Image */}
          <div className={isMobile ? 'modal-image' : 'desktop-modal-image'}>
            <Image
              src={product.images?.[0]?.src || "/placeholder.jpg"}
              alt={product.name}
              width={isMobile ? 120 : 200}
              height={isMobile ? 120 : 200}
              className={isMobile ? 'modal-product-image' : 'desktop-modal-product-image'}
            />
          </div>

          {/* Info */}
          <div className={isMobile ? 'modal-info' : 'desktop-modal-info'}>
            <h3 className={isMobile ? 'modal-product-name' : 'desktop-modal-product-name'}>
              {product.name}
            </h3>

            {/* Rating (Desktop only) */}
            {!isMobile && (
              <div className="desktop-modal-rating">
                <div className="stars">
                  <span>★</span>
                  <span className="rating-value">{averageRating}</span>
                </div>
                <span className="review-count">({totalReviews} تقييم)</span>
              </div>
            )}

            {/* Price */}
            <div className={isMobile ? 'modal-price' : 'desktop-modal-price'}>
              <span className={isMobile ? 'modal-current-price' : 'desktop-modal-current-price'}>
                {finalPrice} <span className={isMobile ? 'modal-currency' : 'desktop-modal-currency'}>ر.س</span>
              </span>
              {originalPrice && (
                <span className={isMobile ? 'modal-original-price' : 'desktop-modal-original-price'}>
                  {originalPrice} ر.س
                </span>
              )}
            </div>

            {/* Sizes */}
            {hasSizes && (
              <div className={isMobile ? 'modal-sizes-section' : 'desktop-modal-sizes-section'}>
                <div className={isMobile ? 'modal-sizes-label' : 'desktop-modal-sizes-label'}>
                  <span>اختر المقاس</span>
                  {selectedSize && <span>({selectedSize})</span>}
                </div>
                <div className={isMobile ? 'modal-sizes-grid' : 'desktop-modal-sizes-grid'}>
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeSelect(size)}
                      className={`${isMobile ? 'modal-size-circle' : 'desktop-modal-size-circle'} ${selectedSize === size ? 'selected' : ''}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {showSizeError && (
                  <p className={isMobile ? 'modal-size-error' : 'desktop-modal-size-error'}>
                    ⚠️ يرجى اختيار المقاس
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className={isMobile ? 'modal-actions' : 'desktop-modal-actions'}>
              <button
                className={`${isMobile ? 'modal-add-to-cart-btn' : 'desktop-modal-add-to-cart-btn'} ${added ? 'added' : ''} ${(hasSizes && !selectedSize) ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={hasSizes && !selectedSize}
              >
                <IoBagAddOutline className={isMobile ? 'modal-cart-icon' : 'desktop-modal-cart-icon'} />
                <span>{added ? 'تمت الإضافة ✨' : 'أضف إلى السلة'}</span>
              </button>
              
              {!isMobile && (
                <button className="desktop-modal-view-product" onClick={() => window.location.href = `/products/${product.slug}`}>
                  عرض تفاصيل المنتج
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';
import React, { useState, useEffect } from "react";
import { useCart } from "@/app/context/CartContext";
import { useReviews } from "@/app/hooks/reviews";
import Image from "next/image";
import Link from "next/link";
import { FiShoppingCart } from 'react-icons/fi';
import { Star, Heart, Share2, Truck, Shield, RotateCcw, Award, Plus, Minus, X, ChevronLeft, ChevronRight } from "lucide-react";
import ReviewForm from "@/app/components/ReviewForm";
import ProductSlider from "@/app/components/ProductSlider/page";
import toast from 'react-hot-toast';
import '@/styles/pages/ProductPage.css';

export default function ProductContent({ product, variations }) {
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [breadcrumbCategories, setBreadcrumbCategories] = useState([]);

  const {
    reviews,
    reviewStats,
    loading: reviewsLoading,
    error: reviewsError,
    submitReview,
    formatDate,
  } = useReviews(product.id);

  // جلب breadcrumb hierarchy
  useEffect(() => {
    const fetchCategoryHierarchy = async () => {
      if (!product?.categories?.length) return;
      
      try {
        const categoryIds = product.categories.map(c => c.id).join(',');
        const res = await fetch(`/api/categories?ids=${categoryIds}`);
        const allCategories = await res.json();
        
        console.log('All Categories from API 👉', allCategories);
        
        // ابحث عن آخر category في السلسلة (الأعمق)
        const deepestCategory = allCategories.reduce((deepest, cat) => {
          if (!deepest) return cat;
          // لو parent موجود، معناته هذا ابن (أعمق)
          return cat.parent > 0 ? cat : deepest;
        }, null);
        
        if (!deepestCategory) return;
        
        console.log('Deepest Category 👉', deepestCategory);
        
        // ابني السلسلة من تحت لفوق
        const hierarchy = [];
        let current = deepestCategory;
        
        while (current && current.parent !== 27) {
          hierarchy.unshift(current);
          current = allCategories.find(cat => cat.id === current.parent);
        }
        
        // حط الأب الرئيسي (اللي parent-ه 27)
        if (current) {
          hierarchy.unshift(current);
        }
        
        console.log('Category Hierarchy 👉', hierarchy);
        setBreadcrumbCategories(hierarchy);
        
      } catch (error) {
        console.error('Error fetching category hierarchy:', error);
      }
    };
    
    fetchCategoryHierarchy();
  }, [product?.categories]);

  // جلب المنتجات المتعلقة
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product.categories?.[0]?.id) return;
      setLoadingRelated(true);
      try {
        const response = await fetch(
          `/api/related-products?category=${product.categories[0].id}&exclude=${product.id}&per_page=8`
        );
        if (response.ok) {
          const data = await response.json();
          setRelatedProducts(data);
        }
      } catch (error) {
        console.error('خطأ في جلب المنتجات المتعلقة:', error);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelatedProducts();
  }, [product.id, product.categories]);

  const hasSizes = product.attributes?.some(attr =>
    attr.name.toLowerCase().includes("size") || attr.name === "المقاس"
  );

  const sizes = hasSizes
    ? product.attributes.find(attr =>
        attr.name.toLowerCase().includes("size") || attr.name === "المقاس"
      ).options
    : [];

  const hasColors = product.attributes?.some(attr =>
    attr.name.toLowerCase().includes("color") || attr.name === "اللون"
  );

  const colors = hasColors
    ? product.attributes.find(attr =>
        attr.name.toLowerCase().includes("color") || attr.name === "اللون"
      ).options
    : [];

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setShowSizeError(false);
    const match = variations?.find(v =>
      v.attributes.some(attr =>
        (attr.name.toLowerCase().includes("size") || attr.name === "المقاس") &&
        attr.option === size
      )
    );
    setSelectedVariationId(match ? match.id : null);
  };

  const handleAddToCart = () => {
    if (hasSizes && !selectedVariationId) {
      toast.error('يرجى اختيار المقاس لإتمام الطلب', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#333',
        },
      });
      return;
    }
    setShowSizeError(false);
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: selectedVariationId || product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.src,
        size: selectedSize || null,
      });
    }
    toast.success(`تمت إضافة ${quantity} قطعة إلى السلة`, {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#333',
      },
    });
  };

  const handleQuantityChange = (change) => {
    setQuantity(Math.max(1, quantity + change));
  };

  const handleReviewSubmit = async (reviewData) => {
    setSubmittingReview(true);
    try {
      const result = await submitReview(reviewData);
      toast.success(result.message);
      setShowReviewForm(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && selectedImage < (product.images?.length || 1) - 1) {
      setSelectedImage(prev => prev + 1);
    }
    if (isRightSwipe && selectedImage > 0) {
      setSelectedImage(prev => prev - 1);
    }
  };

  const goToNextImage = () => {
    setSelectedImage(prev => {
      const nextIndex = prev + 1;
      return nextIndex >= (product.images?.length || 1) ? 0 : nextIndex;
    });
  };

  const goToPrevImage = () => {
    setSelectedImage(prev => {
      const prevIndex = prev - 1;
      return prevIndex < 0 ? (product.images?.length || 1) - 1 : prevIndex;
    });
  };

  const calculateDiscount = () => {
    if (product.regular_price && product.sale_price) {
      const regular = parseFloat(product.regular_price);
      const sale = parseFloat(product.sale_price);
      return Math.round(((regular - sale) / regular) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <div className="productContainer">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="breadcrumb">
        <span>
          <Link href="/">الرئيسية</Link>
        </span>
        
        {breadcrumbCategories.map((cat) => (
          <React.Fragment key={cat.id}>
            <span> / </span>
            <span>
              <Link href={`/(category)/${cat.slug}`}>
                {cat.name}
              </Link>
            </span>
          </React.Fragment>
        ))}
        
        <span> / </span>
        <span className="current">{product?.name}</span>
      </nav>

      <div className="productGrid">
        {/* Product Images */}
        <div className="imageSection">
          <div className="mainImageContainer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}>
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[selectedImage]?.src || product.images[0]?.src}
                alt={product.name}
                width={600}
                height={600}
                className="mainImage"
              />
            ) : (
              <div className="mainImage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#565959' }}>
                لا توجد صورة
              </div>
            )}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  className="mobileImageNav mobileImageNavPrev"
                  onClick={goToPrevImage}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  className="mobileImageNav mobileImageNavNext"
                  onClick={goToNextImage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="imageOverlayButtons">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`overlayButton ${isWishlisted ? 'liked' : ''}`}
              >
                <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
              </button>
              <button className="overlayButton">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {product.images && product.images.length > 1 && (
            <div className="mobileImageDots">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`imageDot ${selectedImage === index ? 'active' : ''}`}
                />
              ))}
            </div>
          )}

          {product.images && product.images.length > 1 && (
            <div className="thumbnailGrid">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                >
                  <Image
                    src={img.src}
                    alt={`صورة ${index + 1}`}
                    width={100}
                    height={100}
                    className="thumbnailImage"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="productInfo">
          <div className="productHeader">
            <h1>{product.name}</h1>
            <div className="ratingSection">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`star ${i < Math.floor(reviewStats.average) ? 'filled' : 'empty'}`}
                  />
                ))}
                <span className="ratingValue">{reviewStats.average}</span>
              </div>
              <span className="reviewCount">({reviewStats.total} تقييم)</span>
            </div>
            <div className="priceSection">
              <span className="currentPrice">
                {product.sale_price || product.price} <Image
                  src="/sar.webp"
                  alt="curentpice"
                  width={20}
                  height={20}
                  className="sarsymbol-img"
                />
              </span>
              {product.regular_price && product.sale_price && (
                <>
                  <span className="originalPrice">
                    {product.regular_price} <Image
                      src="/sar.webp"
                      alt="originalprice"
                      width={20}
                      height={20}
                      className="sarsymbol-img"
                    />
                  </span>
                  <span className="discountBadge">
                    -{discount}%
                  </span>
                </>
              )}
            </div>
          </div>

          {hasColors && (
            <div className="colorSection">
              <h3 className="sectionTitle">اللون: </h3>
              <div className="colorOptions">
                {colors.map((color, index) => (
                  <div key={index} className="colorOption" title={color}>
                    {color}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasSizes && (
            <div className="sizeSection">
              <h3 className="sectionTitle">المقاس: {selectedSize && <span style={{ fontWeight: 'normal' }}>{selectedSize}</span>}</h3>
              <div className="sizeGrid">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeChange(size)}
                    className={`sizeOption ${selectedSize === size ? 'selected' : ''}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.short_description && (
            <div className="featuresBox">
              <h3>نبذة عن المنتج</h3>
              <div dangerouslySetInnerHTML={{ __html: product.short_description }}></div>
            </div>
          )}

          {product.attributes && product.attributes.length > 0 && (
            <div className="featuresBox">
              <h3>مواصفات المنتج</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {product.attributes.slice(0, 5).map((attr, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ fontWeight: '700', color: '#0f1111' }}>{attr.name}:</span>
                    <span style={{ color: '#565959' }}>
                      {Array.isArray(attr.options) ? attr.options.join(', ') : attr.options}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.stock_status && (
            <div className="stockStatus">
              <div className={`stockDot ${product.stock_status === 'instock' ? 'inStock' : 'outOfStock'}`}></div>
              <span className={`stockText ${product.stock_status === 'instock' ? 'inStock' : 'outOfStock'}`}>
                {product.stock_status === 'instock' ? 'متوفر في المخزون' : 'غير متوفر'}
              </span>
              {product.stock_quantity && (
                <span className="stockQuantity">({product.stock_quantity} قطعة متبقية)</span>
              )}
            </div>
          )}

          <div className="shippingInfo">
            <div className="shippingGrid">
              <div className="shippingItem">
                <Truck className="shippingIcon green" />
                <span>توصيل مجاني للطلبات فوق 200 ريال</span>
              </div>
              <div className="shippingItem">
                <RotateCcw className="shippingIcon blue" />
                <span>إرجاع مجاني خلال 30 يوم</span>
              </div>
              <div className="shippingItem">
                <Shield className="shippingIcon purple" />
                <span>ضمان الجودة مضمون</span>
              </div>
            </div>
          </div>

          <div className="mobileActionBox">
            <div className="mobileQuantitySection">
              <div className="mobileQuantityControls">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="mobileQuantityButton"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="mobileQuantityValue">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="mobileQuantityButton"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button onClick={handleAddToCart} className="mobileAddToCartBtn">
              <FiShoppingCart /> أضف إلى السلة
            </button>
          </div>
        </div>

        <div className="buyBox">
          <div className="buyBoxPrice">
            {product.sale_price || product.price} <Image
              src="/sar.webp"
              alt="paybox"
              width={20}
              height={20}
              className="sarsymbol-img"
            />
          </div>
          {product.regular_price && product.sale_price && (
            <div style={{ marginBottom: '8px' }}>
              <span className="originalPrice" style={{ fontSize: '14px' }}>
                {product.regular_price} <Image
                  src="/sar.webp"
                  alt="originalprice"
                  width={20}
                  height={20}
                  className="sarsymbol-img"
                />
              </span>
              <span className="discountBadge" style={{ marginLeft: '8px', fontSize: '12px' }}>
                -{discount}%
              </span>
            </div>
          )}
          <div className="buyBoxShipping">
            <Truck className="w-4 h-4" />
            توصيل مجاني للطلبات فوق 200 ريال
          </div>
          <div className="buyBoxStock">
            <div className={`stockDot ${product.stock_status === 'instock' ? 'inStock' : 'outOfStock'}`}></div>
            <span className={`stockText ${product.stock_status === 'instock' ? 'inStock' : 'outOfStock'}`}>
              {product.stock_status === 'instock' ? 'متوفر في المخزون' : 'غير متوفر'}
            </span>
          </div>
          <div className="buyBoxQuantity">
            <h4>الكمية:</h4>
            <div className="quantityControls">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="quantityButton"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="quantityValue">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="quantityButton"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="buyBoxActions">
            <button onClick={handleAddToCart} className="buyBoxAddToCart">
              <FiShoppingCart /> أضف إلى السلة
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Reviews & Related Products - same as before */}
      <div className="tabsSection">
        <div className="tabsHeader">
          <button
            onClick={() => setActiveTab('description')}
            className={`tabButton ${activeTab === 'description' ? 'active' : ''}`}
          >
            تفاصيل المنتج
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`tabButton ${activeTab === 'specifications' ? 'active' : ''}`}
          >
            المواصفات التقنية
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`tabButton ${activeTab === 'reviews' ? 'active' : ''}`}
          >
            التقييمات ({reviewStats.total})
          </button>
        </div>
        <div className="tabContent">
          {activeTab === 'description' && (
            <div className="descriptionContent">
              <h3>تفاصيل المنتج</h3>
              {product.description ? (
                <div
                  className="descriptionText"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                ></div>
              ) : (
                <p style={{ color: '#565959' }}>لا يوجد وصف تفصيلي لهذا المنتج حالياً.</p>
              )}
            </div>
          )}
          {activeTab === 'specifications' && (
            <div>
              <h3 className="sectionTitle">المواصفات التقنية</h3>
              {product.attributes && product.attributes.length > 0 ? (
                <table className="specificationsTable">
                  <tbody>
                    {product.attributes.map((attr, index) => (
                      <tr key={index}>
                        <td className="specName">{attr.name}</td>
                        <td>{Array.isArray(attr.options) ? attr.options.join(', ') : attr.options}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#565959' }}>لا توجد مواصفات تقنية متاحة لهذا المنتج.</p>
              )}
            </div>
          )}
          {activeTab === 'reviews' && (
            <div>
              <div className="reviewsHeader">
                <h3 className="reviewsTitle">تقييمات العملاء</h3>
                <button
                  className="writeReviewBtn"
                  onClick={() => setShowReviewForm(true)}
                >
                  اكتب تقييماً
                </button>
              </div>
              {reviewsError && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #fecaca'
                }}>
                  {reviewsError}
                </div>
              )}
              {reviewStats.total > 0 && (
                <div className="ratingSummary">
                  <div className="summaryHeader">
                    <div className="overallRating">{reviewStats.average}</div>
                    <div>
                      <div className="summaryStars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`star ${i < Math.floor(reviewStats.average) ? 'filled' : 'empty'}`}
                          />
                        ))}
                      </div>
                      <div className="summaryText">بناءً على {reviewStats.total} تقييم</div>
                    </div>
                  </div>
                  <div className="ratingBreakdown">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="breakdownRow">
                        <span className="breakdownStars">{stars}</span>
                        <Star className="breakdownIcon" />
                        <div className="breakdownBarContainer">
                          <div
                            className="breakdownFill"
                            style={{
                              width: reviewStats.total > 0
                                ? `${(reviewStats.breakdown[stars] / reviewStats.total) * 100}%`
                                : '0%'
                            }}
                          ></div>
                        </div>
                        <span className="breakdownCount">{reviewStats.breakdown[stars] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="reviewsList">
                {reviewsLoading ? (
                  <div className="loadingReviews">
                    <div className="loadingSpinner"></div>
                    <p>جاري تحميل التقييمات...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="reviewItem">
                      <div className="reviewHeader">
                        <div className="reviewerInfo">
                          <div className="reviewerAvatar">
                            {review.reviewer.charAt(0).toUpperCase()}
                          </div>
                          <div className="reviewerMeta">
                            <div className="reviewerName">
                              {review.reviewer}
                              <span className="verifiedBadge">
                                <Award className="w-3 h-3" />
                                موثق
                              </span>
                            </div>
                            <span className="reviewDate">{formatDate(review.date_created)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="reviewRating">
                        <div className="reviewStars">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`reviewStar star ${i < review.rating ? 'filled' : 'empty'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div
                        className="reviewText"
                        dangerouslySetInnerHTML={{ __html: review.review }}
                      />
                      <div className="reviewActions">
                        <button className="helpfulBtn">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                            مفيد؟
                          </div>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="emptyReviews">
                    <h4>لا توجد تقييمات بعد</h4>
                    <p>كن أول من يقيم هذا المنتج</p>
                    <button
                      className="writeReviewBtn"
                      onClick={() => setShowReviewForm(true)}
                    >
                      اكتب أول تقييم
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showReviewForm && (
        <div className="reviewFormOverlay" onClick={(e) => e.target === e.currentTarget && setShowReviewForm(false)}>
          <div className="reviewFormModal">
            <div className="reviewFormHeader">
              <h3>اكتب تقييماً للمنتج</h3>
              <button
                className="reviewFormClose"
                onClick={() => setShowReviewForm(false)}
                disabled={submittingReview}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="reviewFormContent">
              <ReviewForm
                isOpen={showReviewForm}
                onClose={() => setShowReviewForm(false)}
                onSubmit={handleReviewSubmit}
                isSubmitting={submittingReview}
                productName={product.name}
              />
            </div>
          </div>
        </div>
      )}

      {loadingRelated && (
        <div className="skeleton-slider-container">
          <div className="skeleton-slider-header">
            <div className="skeleton-slider-title pulse"></div>
          </div>
          <div className="skeleton-slider-cards">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-card-image pulse"></div>
                <div className="skeleton-card-title pulse"></div>
                <div className="skeleton-card-price pulse"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingRelated && relatedProducts.length > 0 && (
        <ProductSlider
          category={{
            id: product.categories[0]?.id,
            slug: product.categories[0]?.slug,
            name: `منتجات مشابهة`,
          }}
          products={relatedProducts}
        />
      )}
    </div>
  );
}
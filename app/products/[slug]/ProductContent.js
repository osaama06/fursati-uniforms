'use client';
import React, { useState, useEffect, useMemo } from "react";
import { useCart } from "@/app/context/CartContext";
import { useReviews } from "@/app/hooks/reviews";
import SizeGuideTrigger from "@/app/components/Size-guide/SizeGuideTrigger";
import Image from "next/image";
import Link from "next/link";
import { FiShoppingCart } from 'react-icons/fi';
import { Star, Heart, Share2, Award, Plus, Minus, X, ChevronLeft, ChevronRight } from "lucide-react";
import ReviewForm from "@/app/components/ReviewForm";
import ProductSlider from "@/app/components/ProductSlider/page";
import toast from 'react-hot-toast';
import '@/styles/pages/ProductPage.css';

export default function ProductContent({ product, variations = [] }) {
  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAttributeError, setShowAttributeError] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [breadcrumbCategories, setBreadcrumbCategories] = useState([]);
  const [sizeGuideImage, setSizeGuideImage] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [customFieldValues, setCustomFieldValues] = useState({});

  const {
    reviews,
    reviewStats,
    loading: reviewsLoading,
    error: reviewsError,
    submitReview,
    formatDate,
  } = useReviews(product.id);

  const customFields = useMemo(() => {
    const metaValue = product?.meta_data?.find(
      (item) => item.key === "custom_product_fields_json"
    )?.value;

    // إذا القيمة فاضية أو مو string نرجع array فاضي مباشرة بدون JSON.parse
    if (!metaValue || typeof metaValue !== "string" || metaValue.trim() === "") return [];

    try {
      const parsed = JSON.parse(metaValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Invalid custom_product_fields_json:", error);
      return [];
    }
  }, [product?.meta_data]);

  useEffect(() => {
    setSelectedImage(0);
    setSelectedAttributes({});
    setQuantity(1);
    setShowAttributeError(false);
    setCustomFieldValues({});
  }, [product?.id]);

  useEffect(() => {
    const fetchCategoryHierarchy = async () => {
      if (!product?.categories?.length) return;

      try {
        const categoryIds = product.categories.map((c) => c.id).join(',');
        const res = await fetch(`/api/categories?ids=${categoryIds}`);
        const allCategories = await res.json();

        const deepestCategory = allCategories.reduce((deepest, cat) => {
          if (!deepest) return cat;
          return cat.parent > 0 ? cat : deepest;
        }, null);

        if (!deepestCategory) return;

        const hierarchy = [];
        let current = deepestCategory;

        while (current && current.parent !== 27) {
          hierarchy.unshift(current);
          current = allCategories.find((cat) => cat.id === current.parent);
        }

        if (current) {
          hierarchy.unshift(current);
        }

        setBreadcrumbCategories(hierarchy);

        const imgMatch = deepestCategory?.description?.match(/<img[^>]+src=["']([^"']+)["']/);
        setSizeGuideImage(imgMatch ? imgMatch[1] : null);
      } catch (error) {
        console.error('Error fetching category hierarchy:', error);
      }
    };

    fetchCategoryHierarchy();
  }, [product?.categories]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?.categories?.[0]?.id) return;
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
  }, [product?.id, product?.categories]);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);

    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    const storedWishlist = JSON.parse(localStorage.getItem("wishlistItems")) || [];
    const exists = storedWishlist.some((item) => item.id === product.id);
    setIsWishlisted(exists);
  }, [product.id]);

  // ─── Normalization helpers ─────────────────────────────────────────────────

  const normalizeText = (value = "") =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[-_]/g, "");

  // مفتاح فريد لكل attribute — نستخدم slug أو name فقط (id يرجع 0 للـ custom attributes في WooCommerce)
  const buildAttrKey = (attr = {}) => {
    const slug = String(attr?.slug || "").trim();
    const name = String(attr?.name || "").trim();
    return slug || name;
  };

  /**
   * هل variation attribute معين يمثل نفس product attribute؟
   * WooCommerce يحفظ في variation.attributes الـ name فقط أحياناً (بدون slug/id).
   * نقارن بكل الاحتمالات لضمان المطابقة الصحيحة.
   */
  const attributeKeysMatch = (productAttr = {}, variationAttr = {}) => {
    const pSlug = String(productAttr?.slug || "").trim().toLowerCase();
    const pName = String(productAttr?.name || "").trim().toLowerCase();
    const vName = String(variationAttr?.name || "").trim().toLowerCase();
    const vSlug = String(variationAttr?.slug || "").trim().toLowerCase();

    if (!vName && !vSlug) return false;

    // مقارنة مباشرة بين slug و name بكل الاتجاهات
    if (pSlug && vSlug && pSlug === vSlug) return true;
    if (pSlug && vName && pSlug === vName) return true;
    if (pName && vName && pName === vName) return true;
    if (pName && vSlug && pName === vSlug) return true;

    // WooCommerce taxonomy attributes تبدأ بـ pa_ في الـ slug
    // مثال: pa_al-toul يطابق al-toul
    const pSlugStripped = pSlug.replace(/^pa_/, "");
    const vNameStripped = vName.replace(/^pa_/, "");
    const vSlugStripped = vSlug.replace(/^pa_/, "");

    if (pSlugStripped && vNameStripped && pSlugStripped === vNameStripped) return true;
    if (pSlugStripped && vSlugStripped && pSlugStripped === vSlugStripped) return true;

    return false;
  };

  const uniqueValues = (values = []) => {
    const map = new Map();

    values.forEach((value) => {
      const clean = String(value || "").trim();
      const normalized = normalizeText(clean);

      if (clean && normalized && !map.has(normalized)) {
        map.set(normalized, clean);
      }
    });

    return Array.from(map.values());
  };

  // ─── Variation attributes ──────────────────────────────────────────────────

  /**
   * نبني قائمة الـ attributes القابلة للاختيار من مصدر واحد موثوق:
   * product.attributes التي variation: true.
   *
   * الـ options تُجمع من:
   * 1. attr.options (إن كانت موجودة في product.attributes)
   * 2. variation.attributes المقابلة (للتأكد من عدم فقدان أي option)
   */
  const variationAttributes = useMemo(() => {
    return (product?.attributes || [])
      .filter((attr) => attr?.variation)
      .map((attr) => {
        const key = buildAttrKey(attr);

        // نجمع options من مصدرين
        const fromProduct = Array.isArray(attr.options) ? attr.options : [];
        const fromVariations = (variations || []).flatMap((v) =>
          (v.attributes || [])
            .filter((va) => attributeKeysMatch(attr, va))
            .map((va) => String(va.option || "").trim())
            .filter(Boolean)
        );

        return {
          key,
          name: String(attr.name || attr.slug || key).trim(),
          options: uniqueValues([...fromProduct, ...fromVariations]),
          // نحتفظ بمرجع للـ productAttr الأصلي لاستخدامه في المطابقة لاحقاً
          _productAttr: attr,
        };
      })
      .filter((item) => item.options.length > 0);
  }, [product?.attributes, variations]);

  /**
   * نجد الـ variation المطابقة للخيارات المختارة حالياً.
   * نستخدم attributeKeysMatch بدلاً من مقارنة الـ key مباشرة
   * لأن variation.attributes لا تحتوي على id في الغالب.
   */
  const selectedVariation = useMemo(() => {
    if (!variationAttributes.length) return null;

    const hasMissingSelection = variationAttributes.some(
      (attrDef) => !selectedAttributes[attrDef.key]
    );

    if (hasMissingSelection) return null;

    return (
      variations.find((variation) => {
        return variationAttributes.every((attrDef) => {
          const variationAttr = (variation.attributes || []).find((va) =>
            attributeKeysMatch(attrDef._productAttr, va)
          );

          // إذا الـ variation ما عندها هذا الـ attribute أو قيمته فاضية
          // يعني WooCommerce ضابطها على "Any" — تمر تلقائياً
          if (!variationAttr || !variationAttr.option) return true;

          return (
            normalizeText(variationAttr.option) ===
            normalizeText(selectedAttributes[attrDef.key])
          );
        });
      }) || null
    );
  }, [variationAttributes, variations, selectedAttributes]);

  // ─── Color attribute (non-variation, display only) ─────────────────────────

  const colorAttribute = useMemo(() => {
    return (product?.attributes || []).find((attr) => {
      const name = String(attr?.name || "").toLowerCase();
      return (name.includes("color") || attr?.name === "اللون") && !attr?.variation;
    });
  }, [product?.attributes]);

  const colors = colorAttribute?.options || [];
  const hasColors = colors.length > 0;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAttributeChange = (key, value) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [key]: value,
    }));
    setShowAttributeError(false);
  };

  const handleCustomFieldChange = (key, value) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddToCart = () => {
    setShowAttributeError(false);

    if (variationAttributes.length > 0) {
      const missingAttribute = variationAttributes.find(
        (attr) => !selectedAttributes[attr.key]
      );

      if (missingAttribute) {
        setShowAttributeError(true);
        toast.error(`اختر ${missingAttribute.name}`);
        return;
      }

      if (!selectedVariation) {
        toast.error("الخيارات المحددة غير متوفرة");
        return;
      }
    }

    for (const field of customFields) {
      if (field.field_required && !String(customFieldValues[field.field_key] || "").trim()) {
        toast.error(`يرجى اختيار / تعبئة ${field.field_label}`);
        return;
      }
    }

    // نبني customFields بشكل يحتفظ بالـ label الواضح بجانب القيمة
    // { student_name: { label: "الاسم", value: "محمد" } }
    const customFieldsWithLabels = {};
    customFields.forEach((field) => {
      const value = customFieldValues[field.field_key];
      if (value !== undefined && value !== "") {
        customFieldsWithLabels[field.field_key] = {
          label: field.field_label,
          value: String(value),
        };
      }
    });

    const itemPayload = {
      id: selectedVariation?.id || product.id,
      productId: product.id,
      variationId: selectedVariation?.id || null,
      name: product.name,
      price: selectedVariation?.price || product.sale_price || product.price,
      image: product.images?.[0]?.src,
      selectedAttributes,
      customFields: customFieldsWithLabels,
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(itemPayload);
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
    const lastIndex = (product.images?.length || 1) - 1;

    if (isLeftSwipe && selectedImage > 0) {
      setSelectedImage((prev) => prev - 1);
    }

    if (isRightSwipe && selectedImage < lastIndex) {
      setSelectedImage((prev) => prev + 1);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const goToNextImage = () => {
    setSelectedImage((prev) => {
      const nextIndex = prev + 1;
      return nextIndex >= (product.images?.length || 1) ? 0 : nextIndex;
    });
  };

  const goToPrevImage = () => {
    setSelectedImage((prev) => {
      const prevIndex = prev - 1;
      return prevIndex < 0 ? (product.images?.length || 1) - 1 : prevIndex;
    });
  };

  const handleImageMouseMove = (e) => {
    if (!isDesktop || !currentImage) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const lensSize = 180;

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const clampedX = Math.max(lensSize / 2, Math.min(rect.width - lensSize / 2, x));
    const clampedY = Math.max(lensSize / 2, Math.min(rect.height - lensSize / 2, y));

    setZoomPosition({ x: percentX, y: percentY });
    setLensPosition({ x: clampedX, y: clampedY });
    setZoomVisible(true);
  };

  const handleImageMouseLeave = () => {
    setZoomVisible(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `شاهد هذا المنتج: ${product.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط المنتج");
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.error("تعذر مشاركة المنتج");
      }
    }
  };

  const handleToggleWishlist = () => {
    const storedWishlist = JSON.parse(localStorage.getItem("wishlistItems")) || [];
    const exists = storedWishlist.some((item) => item.id === product.id);

    let updatedWishlist = [];

    if (exists) {
      updatedWishlist = storedWishlist.filter((item) => item.id !== product.id);
      setIsWishlisted(false);
      toast.success("تمت إزالة المنتج من المفضلة");
    } else {
      const wishlistProduct = {
        id: product.id,
        name: product.name,
        price: product.sale_price || product.price,
        image: product.images?.[0]?.src || "",
        slug: product.slug || "",
      };

      updatedWishlist = [...storedWishlist, wishlistProduct];
      setIsWishlisted(true);
      toast.success("تمت إضافة المنتج إلى المفضلة");
    }

    localStorage.setItem("wishlistItems", JSON.stringify(updatedWishlist));
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
  const currentImage = product.images?.[selectedImage]?.src || product.images?.[0]?.src || "";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="productContainer">
      <nav className="breadcrumb" aria-label="breadcrumb">
        <span>
          <Link href="/">الرئيسية</Link>
        </span>

        {breadcrumbCategories.map((cat) => (
          <React.Fragment key={cat.id}>
            <span> / </span>
            <span>
              <Link href={`/${cat.slug}`}>
                {cat.name}
              </Link>
            </span>
          </React.Fragment>
        ))}
      </nav>

      <div className="productGrid">
        <div className="imageSection">
          <div
            className="mainImageContainer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseMove={handleImageMouseMove}
            onMouseLeave={handleImageMouseLeave}
          >
            {product.images && product.images.length > 0 ? (
              <Image
                src={currentImage}
                alt={product.name}
                width={600}
                height={600}
                className="mainImage"
              />
            ) : (
              <div
                className="mainImage"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#565959'
                }}
              >
                لا توجد صورة
              </div>
            )}

            {isDesktop && zoomVisible && currentImage && (
              <div
                className="desktopZoomLens"
                style={{
                  left: `${lensPosition.x}px`,
                  top: `${lensPosition.y}px`,
                  backgroundImage: `url(${currentImage})`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              />
            )}

            {product.images && product.images.length > 1 && (
              <>
                <button
                  className="mobileImageNav mobileImageNavPrev"
                  onClick={goToPrevImage}
                  type="button"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  className="mobileImageNav mobileImageNavNext"
                  onClick={goToNextImage}
                  type="button"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="imageOverlayButtons">
              <button
                onClick={handleToggleWishlist}
                className={`overlayButton ${isWishlisted ? 'liked' : ''}`}
                type="button"
              >
                <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
              </button>

              <button className="overlayButton" onClick={handleShare} type="button">
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
                  type="button"
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
                  type="button"
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
                {selectedVariation?.price || product.sale_price || product.price}
                <Image
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
                    {product.regular_price}
                    <Image
                      src="/sar.webp"
                      alt="originalprice"
                      width={20}
                      height={20}
                      className="sarsymbol-img"
                    />
                  </span>
                  <span className="discountBadge">-{discount}%</span>
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

          {variationAttributes.map((attr) => (
            <div className="sizeSection" key={attr.key}>
              <h3 className="sectionTitle">
                {attr.name}:{" "}
                {selectedAttributes[attr.key] && (
                  <span style={{ fontWeight: 'normal' }}>
                    {selectedAttributes[attr.key]}
                  </span>
                )}
              </h3>

              <div className="sizeGrid">
                {attr.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAttributeChange(attr.key, option)}
                    className={`sizeOption ${selectedAttributes[attr.key] === option ? 'selected' : ''}`}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {variationAttributes.length > 0 && showAttributeError && (
            <p style={{ color: "red", marginTop: "10px", fontSize: "14px" }}>
              يرجى اختيار جميع الخيارات المطلوبة
            </p>
          )}

          {sizeGuideImage && (
            <SizeGuideTrigger image={sizeGuideImage} />
          )}

          {customFields.length > 0 && (
            <div className="customFieldsSection">
              {customFields.map((field, index) => {
                const value = customFieldValues[field.field_key] || "";
                const options = Array.isArray(field.field_options)
                  ? field.field_options
                  : [];

                return (
                  <div className="customFieldBlock" key={field.field_key || index}>
                    <label className="customFieldLabel">
                      {field.field_label}
                      {field.field_required ? " *" : ""}
                    </label>

                    {field.field_type === "buttons" && (
                      <div className="customFieldButtons">
                        {options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`customFieldButton ${value === option ? "active" : ""}`}
                            onClick={() => handleCustomFieldChange(field.field_key, option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {field.field_type === "select" && (
                      <select
                        className="customFieldInput"
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                      >
                        <option value="">اختر {field.field_label}</option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.field_type === "textarea" && (
                      <textarea
                        className="customFieldTextarea"
                        placeholder={field.field_placeholder || ""}
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                      />
                    )}

                    {(field.field_type === "text" || field.field_type === "number") && (
                      <input
                        className="customFieldInput"
                        type={field.field_input_type || field.field_type || "text"}
                        placeholder={field.field_placeholder || ""}
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {product.short_description && (
            <div className="featuresBox">
              <h3>نبذة عن المنتج</h3>
              <div dangerouslySetInnerHTML={{ __html: product.short_description }}></div>
            </div>
          )}

          <div className="mobileActionBox">
            <div className="mobileQuantitySection">
              <div className="mobileQuantityControls">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="mobileQuantityButton"
                  type="button"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="mobileQuantityValue">{quantity}</span>

                <button
                  onClick={() => handleQuantityChange(1)}
                  className="mobileQuantityButton"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button onClick={handleAddToCart} className="mobileAddToCartBtn" type="button">
              <FiShoppingCart /> أضف إلى السلة
            </button>
          </div>
        </div>

        <div className="buyBox">
          <div className="buyBoxPrice">
            {selectedVariation?.price || product.sale_price || product.price}
            <Image
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
                {product.regular_price}
                <Image
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

          <div className="buyBoxQuantity">
            <h4>الكمية:</h4>
            <div className="quantityControls">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="quantityButton"
                type="button"
              >
                <Minus className="w-3 h-3" />
              </button>

              <span className="quantityValue">{quantity}</span>

              <button
                onClick={() => handleQuantityChange(1)}
                className="quantityButton"
                type="button"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="buyBoxActions">
            <button onClick={handleAddToCart} className="buyBoxAddToCart" type="button">
              <FiShoppingCart /> أضف إلى السلة
            </button>
          </div>
        </div>
      </div>

      <div className="tabsSection">
        <div className="tabsHeader">
          <button
            onClick={() => setActiveTab('description')}
            className={`tabButton ${activeTab === 'description' ? 'active' : ''}`}
            type="button"
          >
            تفاصيل المنتج
          </button>

          <button
            onClick={() => setActiveTab('specifications')}
            className={`tabButton ${activeTab === 'specifications' ? 'active' : ''}`}
            type="button"
          >
            المواصفات التقنية
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`tabButton ${activeTab === 'reviews' ? 'active' : ''}`}
            type="button"
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
                  type="button"
                >
                  اكتب تقييماً
                </button>
              </div>

              {reviewsError && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #fecaca'
                  }}
                >
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
                        <button className="helpfulBtn" type="button">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
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
                      type="button"
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
        <div
          className="reviewFormOverlay"
          onClick={(e) => e.target === e.currentTarget && setShowReviewForm(false)}
        >
          <div className="reviewFormModal">
            <div className="reviewFormHeader">
              <h3>اكتب تقييماً للمنتج</h3>
              <button
                className="reviewFormClose"
                onClick={() => setShowReviewForm(false)}
                disabled={submittingReview}
                type="button"
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
            id: product.categories?.[0]?.id,
            slug: product.categories?.[0]?.slug,
            name: `منتجات مشابهة`,
          }}
          products={relatedProducts}
        />
      )}
    </div>
  );
}
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
import { useWishlist } from '@/app/context/WishlistContext';
import '@/styles/pages/ProductPage.css';

export default function ProductContent({ product, variations = [] }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistItems } = useWishlist();
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
    if (!metaValue || typeof metaValue !== "string" || metaValue.trim() === "") return [];
    try {
      const parsed = JSON.parse(metaValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Invalid custom_product_fields_json:", error);
      return [];
    }
  }, [product?.meta_data]);

  const extraPrice = useMemo(() => {
    return customFields.reduce((total, field) => {
      const options = Array.isArray(field.field_options) ? field.field_options : [];
      if (field.field_type === "radio") {
        const selected = customFieldValues[field.field_key];
        if (!selected) return total;
        const match = options.find((opt) => opt.label === selected);
        return total + (Number(match?.price) || 0);
      }
      if (field.field_type === "checkbox") {
        const selected = customFieldValues[field.field_key];
        if (!Array.isArray(selected) || selected.length === 0) return total;
        const addedPrice = selected.reduce((sum, label) => {
          const match = options.find((opt) => opt.label === label);
          return sum + (Number(match?.price) || 0);
        }, 0);
        return total + addedPrice;
      }
      return total;
    }, 0);
  }, [customFields, customFieldValues]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const normalizeText = (value = "") =>
    String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/[-_]/g, "");

  const buildAttrKey = (attr = {}) => {
    const slug = String(attr?.slug || "").trim();
    const name = String(attr?.name || "").trim();
    return slug || name;
  };

  const attributeKeysMatch = (productAttr = {}, variationAttr = {}) => {
    const pSlug = String(productAttr?.slug || "").trim().toLowerCase();
    const pName = String(productAttr?.name || "").trim().toLowerCase();
    const vName = String(variationAttr?.name || "").trim().toLowerCase();
    const vSlug = String(variationAttr?.slug || "").trim().toLowerCase();
    if (!vName && !vSlug) return false;
    if (pSlug && vSlug && pSlug === vSlug) return true;
    if (pSlug && vName && pSlug === vName) return true;
    if (pName && vName && pName === vName) return true;
    if (pName && vSlug && pName === vSlug) return true;
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
      if (clean && normalized && !map.has(normalized)) map.set(normalized, clean);
    });
    return Array.from(map.values());
  };

  // ─── Variation Attributes (includes color if it's a variation) ───────────

  const variationAttributes = useMemo(() => {
    return (product?.attributes || [])
      .filter((attr) => attr?.variation)
      .map((attr) => {
        const key = buildAttrKey(attr);
        const fromProduct = Array.isArray(attr.options) ? attr.options : [];
        const fromVariations = (variations || []).flatMap((v) =>
          (v.attributes || [])
            .filter((va) => attributeKeysMatch(attr, va))
            .map((va) => String(va.option || "").trim())
            .filter(Boolean)
        );

        // Detect if this attribute is a color attribute
        const attrNameLower = String(attr.name || "").toLowerCase();
        const isColor =
          attrNameLower.includes("color") ||
          attrNameLower.includes("colour") ||
          attr.name === "اللون" ||
          attrNameLower === "لون";

        return {
          key,
          name: String(attr.name || attr.slug || key).trim(),
          options: uniqueValues([...fromProduct, ...fromVariations]),
          isColor,
          _productAttr: attr,
        };
      })
      .filter((item) => item.options.length > 0);
  }, [product?.attributes, variations]);

  // ─── Selected Variation ──────────────────────────────────────────────────

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
          if (!variationAttr || !variationAttr.option) return true;
          return (
            normalizeText(variationAttr.option) ===
            normalizeText(selectedAttributes[attrDef.key])
          );
        });
      }) || null
    );
  }, [variationAttributes, variations, selectedAttributes]);

  // ─── Image list: prefer variation image when available ───────────────────

  /**
   * Build the image gallery the user sees.
   * - If a variation with its own image is selected → show that image first,
   *   then the rest of the product gallery.
   * - Otherwise → show the full product gallery as-is.
   */
  const displayImages = useMemo(() => {
    const productImages = product.images || [];
    const variationImg = selectedVariation?.image?.src;

    if (!variationImg) return productImages;

    // Put variation image first, remove duplicate if already in gallery
    const rest = productImages.filter(
      (img) => normalizeText(img.src) !== normalizeText(variationImg)
    );
    return [{ src: variationImg, alt: selectedVariation?.image?.alt || product.name }, ...rest];
  }, [selectedVariation, product.images, product.name]);

  // ─── Reset image to 0 when variation changes ────────────────────────────

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariation?.id]);

  // ─── Product change reset ────────────────────────────────────────────────

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
        if (current) hierarchy.unshift(current);
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
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') setIsWishlisted(isInWishlist(product.id));
  }, [product.id, wishlistItems]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleAttributeChange = (key, value) => {
    setSelectedAttributes((prev) => ({ ...prev, [key]: value }));
    setShowAttributeError(false);
  };

  const handleCustomFieldChange = (key, value) => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key, label) => {
    setCustomFieldValues((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const exists = current.includes(label);
      return { ...prev, [key]: exists ? current.filter((l) => l !== label) : [...current, label] };
    });
  };

  const handleAddToCart = () => {
    setShowAttributeError(false);
    if (variationAttributes.length > 0) {
      const missingAttribute = variationAttributes.find((attr) => !selectedAttributes[attr.key]);
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
      if (!field.field_required) continue;
      const val = customFieldValues[field.field_key];
      const isEmpty =
        field.field_type === "checkbox"
          ? !Array.isArray(val) || val.length === 0
          : field.field_type === "measurements"
          ? !val || typeof val !== "object" ||
            (field.field_inputs || []).some((inp) => !String(val[inp.key] || "").trim())
          : !String(val || "").trim();
      if (isEmpty) {
        toast.error(`يرجى اختيار / تعبئة ${field.field_label}`);
        return;
      }
    }

    const customFieldsWithLabels = {};
    customFields.forEach((field) => {
      const value = customFieldValues[field.field_key];
      const options = Array.isArray(field.field_options) ? field.field_options : [];
      if (field.field_type === "checkbox") {
        if (!Array.isArray(value) || value.length === 0) return;
        const totalPrice = value.reduce((sum, label) => {
          const match = options.find((opt) => opt.label === label);
          return sum + (Number(match?.price) || 0);
        }, 0);
        customFieldsWithLabels[field.field_key] = {
          label: field.field_label,
          value: value.join(" / "),
          price: totalPrice,
        };
        return;
      }
      if (field.field_type === "measurements") {
        const val = customFieldValues[field.field_key];
        if (val && typeof val === "object") {
          const formatted = (field.field_inputs || [])
            .map((inp) => `${inp.label}: ${val[inp.key] || 0} ${inp.unit || ""}`)
            .join(" | ");
          customFieldsWithLabels[field.field_key] = { label: field.field_label, value: formatted };
        }
        return;
      }
      if (value !== undefined && String(value).trim() !== "") {
        const entry = { label: field.field_label, value: String(value) };
        if (field.field_type === "radio") {
          const match = options.find((opt) => (opt.label || opt) === value);
          entry.price = Number(match?.price) || 0;
        }
        customFieldsWithLabels[field.field_key] = entry;
      }
    });

    // Use variation image if available, else product first image
    const cartImage =
      selectedVariation?.image?.src || product.images?.[0]?.src;

    const itemPayload = {
      id: selectedVariation?.id || product.id,
      productId: product.id,
      variationId: selectedVariation?.id || null,
      name: product.name,
      price: (
        parseFloat(selectedVariation?.price || product.sale_price || product.price || 0) +
        extraPrice
      ).toFixed(2),
      image: cartImage,
      selectedAttributes,
      customFields: customFieldsWithLabels,
    };

    for (let i = 0; i < quantity; i++) addToCart(itemPayload);

    toast.success(`تمت إضافة ${quantity} قطعة إلى السلة`, {
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
      iconTheme: { primary: '#fff', secondary: '#333' },
    });
  };

  const handleQuantityChange = (change) => setQuantity(Math.max(1, quantity + change));

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

  const handleTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove  = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd   = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const lastIndex = (displayImages.length || 1) - 1;
    if (distance > 50  && selectedImage > 0)         setSelectedImage((p) => p - 1);
    if (distance < -50 && selectedImage < lastIndex) setSelectedImage((p) => p + 1);
    setTouchStart(null); setTouchEnd(null);
  };

  const goToNextImage = () =>
    setSelectedImage((p) => (p + 1 >= (displayImages.length || 1) ? 0 : p + 1));
  const goToPrevImage = () =>
    setSelectedImage((p) => (p - 1 < 0 ? (displayImages.length || 1) - 1 : p - 1));

  const handleImageMouseMove = (e) => {
    if (!isDesktop || !currentImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const lensSize = 180;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setZoomPosition({
      x: Math.max(0, Math.min(100, (x / rect.width) * 100)),
      y: Math.max(0, Math.min(100, (y / rect.height) * 100)),
    });
    setLensPosition({
      x: Math.max(lensSize / 2, Math.min(rect.width  - lensSize / 2, x)),
      y: Math.max(lensSize / 2, Math.min(rect.height - lensSize / 2, y)),
    });
    setZoomVisible(true);
  };
  const handleImageMouseLeave = () => setZoomVisible(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `شاهد هذا المنتج: ${product.name}`, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط المنتج");
    } catch (error) {
      if (error.name !== "AbortError") toast.error("تعذر مشاركة المنتج");
    }
  };

  const handleToggleWishlist = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      setIsWishlisted(false);
      toast.success('تمت إزالة المنتج من المفضلة');
    } else {
      addToWishlist(product);
      setIsWishlisted(true);
      toast.success('تمت إضافة المنتج إلى المفضلة');
    }
  };

  const calculateDiscount = () => {
    if (product.regular_price && product.sale_price) {
      const regular = parseFloat(product.regular_price);
      const sale    = parseFloat(product.sale_price);
      return Math.round(((regular - sale) / regular) * 100);
    }
    return 0;
  };
  const discount = calculateDiscount();

  // Current displayed price (variation price takes priority)
  const currentPrice =
    parseFloat(selectedVariation?.price || product.sale_price || product.price || 0) + extraPrice;

  // Show sale/discount only when no specific variation is selected OR variation has its own sale
  const showDiscount =
    !selectedVariation &&
    product.regular_price &&
    product.sale_price;

  const currentImage = displayImages[selectedImage]?.src || displayImages[0]?.src || "";

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="productContainer">
      <nav className="breadcrumb" aria-label="breadcrumb">
        <span><Link href="/">الرئيسية</Link></span>
        {breadcrumbCategories.map((cat) => (
          <React.Fragment key={cat.id}>
            <span> / </span>
            <span><Link href={`/${cat.slug}`}>{cat.name}</Link></span>
          </React.Fragment>
        ))}
      </nav>

      <div className="productGrid">

        {/* ── Image Section ── */}
        <div className="imageSection">
          <div
            className="mainImageContainer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseMove={handleImageMouseMove}
            onMouseLeave={handleImageMouseLeave}
          >
            {displayImages.length > 0 ? (
              <Image
                src={currentImage}
                alt={product.name}
                width={600}
                height={600}
                className="mainImage"
              />
            ) : (
              <div className="mainImage" style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'#565959' }}>
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

            {displayImages.length > 1 && (
              <>
                <button className="mobileImageNav mobileImageNavPrev" onClick={goToPrevImage} type="button">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button className="mobileImageNav mobileImageNavNext" onClick={goToNextImage} type="button">
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

          {/* Thumbnails (mobile = horizontal, desktop = vertical via CSS) */}
          {displayImages.length > 1 && (
            <div className="thumbnailGrid">
              {displayImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  type="button"
                >
                  <Image
                    src={img.src}
                    alt={img.alt || `صورة ${index + 1}`}
                    width={100}
                    height={100}
                    className="thumbnailImage"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="productInfo">
          <div className="productHeader">
            <h1>{product.name}</h1>
            <div className="ratingSection">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`star ${i < Math.floor(reviewStats.average) ? 'filled' : 'empty'}`} />
                ))}
                <span className="ratingValue">{reviewStats.average}</span>
              </div>
              <span className="reviewCount">({reviewStats.total} تقييم)</span>
            </div>

            <div className="priceSection">
              <span className="currentPrice">
                {currentPrice.toFixed(2)}
                <Image src="/sar.webp" alt="ريال" width={20} height={20} className="sarsymbol-img" />
              </span>
              {showDiscount && (
                <>
                  <span className="originalPrice">
                    {product.regular_price}
                    <Image src="/sar.webp" alt="ريال" width={20} height={20} className="sarsymbol-img" />
                  </span>
                  <span className="discountBadge">-{discount}%</span>
                </>
              )}
            </div>
          </div>

          {/* ── Variation Attributes (color + size + any other) ── */}
          {variationAttributes.map((attr) => (
            <div className={attr.isColor ? "colorSection" : "sizeSection"} key={attr.key}>
              <h3 className="sectionTitle">
                {attr.name}:{" "}
                {selectedAttributes[attr.key] && (
                  <span style={{ fontWeight: 'normal' }}>{selectedAttributes[attr.key]}</span>
                )}
              </h3>

              {attr.isColor ? (
                /* Color swatches */
                <div className="colorSwatches">
                  {attr.options.map((option) => {
                    const isSelected = selectedAttributes[attr.key] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleAttributeChange(attr.key, option)}
                        className={`colorSwatch ${isSelected ? 'selected' : ''}`}
                        title={option}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Size / other attribute buttons */
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
              )}
            </div>
          ))}

          {variationAttributes.length > 0 && showAttributeError && (
            <p style={{ color: "red", marginTop: "10px", fontSize: "14px" }}>
              يرجى اختيار جميع الخيارات المطلوبة
            </p>
          )}

          {sizeGuideImage && <SizeGuideTrigger image={sizeGuideImage} />}

          {/* ── Custom Fields ── */}
          {customFields.length > 0 && (
            <div className="customFieldsSection">
              {customFields.map((field, index) => {
                const value = customFieldValues[field.field_key] ?? "";
                const options = Array.isArray(field.field_options) ? field.field_options : [];
                return (
                  <div className="customFieldBlock" key={field.field_key || index}>
                    <label className="customFieldLabel">
                      {field.field_label}{field.field_required ? " *" : ""}
                    </label>
                    {field.field_type === "buttons" && (
                      <div className="customFieldButtons">
                        {options.map((option) => (
                          <button
                            key={option} type="button"
                            className={`customFieldButton ${value === option ? "active" : ""}`}
                            onClick={() => handleCustomFieldChange(field.field_key, option)}
                          >{option}</button>
                        ))}
                      </div>
                    )}
                    {field.field_type === "radio" && (
                      <div className="customFieldRadioGroup">
                        {options.map((option) => {
                          const optLabel = option.label || option;
                          const optPrice = Number(option.price) || 0;
                          const isSelected = value === optLabel;
                          return (
                            <button key={optLabel} type="button"
                              className={`customFieldRadioOption ${isSelected ? "active" : ""}`}
                              onClick={() => handleCustomFieldChange(field.field_key, optLabel)}
                            >
                              <span className="radioOptionLabel">{optLabel}</span>
                              {optPrice > 0
                                ? <span className="radioOptionPrice">+{optPrice} ر.س</span>
                                : <span className="radioOptionPriceFree">مجاناً</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {field.field_type === "checkbox" && (
                      <div className="customFieldCheckboxGroup">
                        {options.map((option) => {
                          const optLabel = option.label || option;
                          const optPrice = Number(option.price) || 0;
                          const selectedArr = Array.isArray(value) ? value : [];
                          const isChecked = selectedArr.includes(optLabel);
                          return (
                            <button key={optLabel} type="button"
                              className={`customFieldCheckboxOption ${isChecked ? "active" : ""}`}
                              onClick={() => handleCheckboxChange(field.field_key, optLabel)}
                            >
                              <span className="checkboxIndicator">{isChecked ? "✓" : ""}</span>
                              <span className="checkboxOptionLabel">{optLabel}</span>
                              {optPrice > 0
                                ? <span className="checkboxOptionPrice">+{optPrice} ر.س</span>
                                : <span className="checkboxOptionPriceFree">مجاناً</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {field.field_type === "measurements" && (
                      <div className="customFieldMeasurements">
                        {(field.field_inputs || []).map((input) => {
                          const inputVal = (customFieldValues[field.field_key] || {})[input.key] || "";
                          return (
                            <div className="measurementItem" key={input.key}>
                              <label className="measurementLabel">{input.label}</label>
                              <div className="measurementInputWrapper">
                                <input
                                  className="measurementInput" type="number" min="0" placeholder="0"
                                  value={inputVal}
                                  onChange={(e) => handleCustomFieldChange(field.field_key, {
                                    ...(customFieldValues[field.field_key] || {}),
                                    [input.key]: e.target.value,
                                  })}
                                />
                                {input.unit && <span className="measurementUnit">{input.unit}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {field.field_type === "select" && (
                      <select className="customFieldInput" value={value}
                        onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                      >
                        <option value="">اختر {field.field_label}</option>
                        {options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    {field.field_type === "textarea" && (
                      <textarea className="customFieldTextarea"
                        placeholder={field.field_placeholder || ""} value={value}
                        onChange={(e) => handleCustomFieldChange(field.field_key, e.target.value)}
                      />
                    )}
                    {(field.field_type === "text" || field.field_type === "number") && (
                      <input className="customFieldInput"
                        type={field.field_input_type || field.field_type || "text"}
                        placeholder={field.field_placeholder || ""} value={value}
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
              <div dangerouslySetInnerHTML={{ __html: product.short_description }} />
            </div>
          )}

          {/* Mobile sticky action bar */}
          <div className="mobileActionBox">
            <div className="mobileQuantitySection">
              <div className="mobileQuantityControls">
                <button onClick={() => handleQuantityChange(-1)} className="mobileQuantityButton" type="button">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="mobileQuantityValue">{quantity}</span>
                <button onClick={() => handleQuantityChange(1)} className="mobileQuantityButton" type="button">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button onClick={handleAddToCart} className="mobileAddToCartBtn" type="button">
              <FiShoppingCart /> أضف إلى السلة
            </button>
          </div>
        </div>

        {/* ── Buy Box (desktop) ── */}
        <div className="buyBox">
          <div className="buyBoxPrice">
            {currentPrice.toFixed(2)}
            <Image src="/sar.webp" alt="ريال" width={20} height={20} className="sarsymbol-img" />
          </div>
          {showDiscount && (
            <div style={{ marginBottom: '8px' }}>
              <span className="originalPrice" style={{ fontSize: '14px' }}>
                {product.regular_price}
                <Image src="/sar.webp" alt="ريال" width={20} height={20} className="sarsymbol-img" />
              </span>
              <span className="discountBadge" style={{ marginLeft: '8px', fontSize: '12px' }}>
                -{discount}%
              </span>
            </div>
          )}
          <div className="buyBoxQuantity">
            <h4>الكمية:</h4>
            <div className="quantityControls">
              <button onClick={() => handleQuantityChange(-1)} className="quantityButton" type="button">
                <Minus className="w-3 h-3" />
              </button>
              <span className="quantityValue">{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} className="quantityButton" type="button">
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

      {/* ── Tabs ── */}
      <div className="tabsSection">
        <div className="tabsHeader">
          <button onClick={() => setActiveTab('description')} className={`tabButton ${activeTab === 'description' ? 'active' : ''}`} type="button">
            تفاصيل المنتج
          </button>
          <button onClick={() => setActiveTab('specifications')} className={`tabButton ${activeTab === 'specifications' ? 'active' : ''}`} type="button">
            المواصفات التقنية
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`tabButton ${activeTab === 'reviews' ? 'active' : ''}`} type="button">
            التقييمات ({reviewStats.total})
          </button>
        </div>

        <div className="tabContent">
          {activeTab === 'description' && (
            <div className="descriptionContent">
              <h3>تفاصيل المنتج</h3>
              {product.description
                ? <div className="descriptionText" dangerouslySetInnerHTML={{ __html: product.description }} />
                : <p style={{ color: '#565959' }}>لا يوجد وصف تفصيلي لهذا المنتج حالياً.</p>}
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
                <button className="writeReviewBtn" onClick={() => setShowReviewForm(true)} type="button">
                  اكتب تقييماً
                </button>
              </div>
              {reviewsError && (
                <div style={{ padding:'16px', backgroundColor:'#fef2f2', color:'#dc2626', borderRadius:'8px', marginBottom:'16px', border:'1px solid #fecaca' }}>
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
                          <Star key={i} className={`star ${i < Math.floor(reviewStats.average) ? 'filled' : 'empty'}`} />
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
                          <div className="breakdownFill" style={{ width: reviewStats.total > 0 ? `${(reviewStats.breakdown[stars] / reviewStats.total) * 100}%` : '0%' }} />
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
                    <div className="loadingSpinner" />
                    <p>جاري تحميل التقييمات...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="reviewItem">
                      <div className="reviewHeader">
                        <div className="reviewerInfo">
                          <div className="reviewerAvatar">{review.reviewer.charAt(0).toUpperCase()}</div>
                          <div className="reviewerMeta">
                            <div className="reviewerName">
                              {review.reviewer}
                              <span className="verifiedBadge"><Award className="w-3 h-3" />موثق</span>
                            </div>
                            <span className="reviewDate">{formatDate(review.date_created)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="reviewRating">
                        <div className="reviewStars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`reviewStar star ${i < review.rating ? 'filled' : 'empty'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="reviewText" dangerouslySetInnerHTML={{ __html: review.review }} />
                      <div className="reviewActions">
                        <button className="helpfulBtn" type="button">
                          <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <button className="writeReviewBtn" onClick={() => setShowReviewForm(true)} type="button">
                      اكتب أول تقييم
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Review Form Modal ── */}
      {showReviewForm && (
        <div className="reviewFormOverlay" onClick={(e) => e.target === e.currentTarget && setShowReviewForm(false)}>
          <div className="reviewFormModal">
            <div className="reviewFormHeader">
              <h3>اكتب تقييماً للمنتج</h3>
              <button className="reviewFormClose" onClick={() => setShowReviewForm(false)} disabled={submittingReview} type="button">
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

      {/* ── Related Products ── */}
      {loadingRelated && (
        <div className="skeleton-slider-container">
          <div className="skeleton-slider-header">
            <div className="skeleton-slider-title pulse" />
          </div>
          <div className="skeleton-slider-cards">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-card-image pulse" />
                <div className="skeleton-card-title pulse" />
                <div className="skeleton-card-price pulse" />
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
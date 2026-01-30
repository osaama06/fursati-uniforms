'use client';
import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
// استخدام المسار النسبي لضمان العمل بغض النظر عن إعدادات الـ alias
import "@/styles/components/BannerSlider.css";

const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export default function BannerSlider() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function fetchBanners() {
      try {
        const res = await fetch('https://furssati.io/wp-json/wp/v2/banner?_embed');
        const data = await res.json();

        // استخراج الصور بأمان بدون أنواع TS معقدة لتجنب أخطاء السنتاكس
        const bannerImages = data.map((post) => {
           // التأكد من وجود البيانات المتداخلة
           const media = post._embedded && post._embedded['wp:featuredmedia'];
           return (media && media[0] && media[0].source_url) || '';
        });

        if (mounted) {
          setBanners(bannerImages.filter(Boolean));
          setIsLoading(false);
        }
      } catch (err) {
        console.error("فشل في تحميل البانرات:", err);
        if (mounted) setIsLoading(false);
      }
    }

    fetchBanners();
    return () => { mounted = false; };
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = (index) => {
    setCurrent(index);
  };

  useEffect(() => {
    if (isPaused || banners.length === 0) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length, nextSlide]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const SWIPE_THRESHOLD = 50;

    if (distance > SWIPE_THRESHOLD) {
      nextSlide();
    } else if (distance < -SWIPE_THRESHOLD) {
      prevSlide();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (isLoading || banners.length === 0) {
    return (
      <div className="banner-skeleton">
        <div className="skeleton-shimmer"></div>
      </div>
    );
  }

  return (
    <div
      className="banner-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Promotional Banners"
    >
      {banners.map((src, index) => (
        <div
          key={index}
          className={`banner-slide ${index === current ? "active" : ""}`}
        >
<Image
  src={src}
  alt={`Banner ${index + 1}`}
  fill
  sizes="100vw"
  className="banner-image"
  priority={index === 0}
  fetchPriority={index === 0 ? "high" : "auto"}
  draggable={false}
/>

          {/* <div className="banner-overlay"></div> */}
        </div>
      ))}

      <button 
        className="banner-control prev" 
        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
        aria-label="Previous Slide"
      >
        <ChevronLeft />
      </button>

      <button 
        className="banner-control next" 
        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
        aria-label="Next Slide"
      >
        <ChevronRight />
      </button>

      <div className="banner-indicators">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`banner-dot ${index === current ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === current}
          />
        ))}
      </div>
    </div>
  );
}
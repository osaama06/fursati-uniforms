'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
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
        const [desktopRes, mobileRes] = await Promise.all([
          fetch("https://furssati.io/wp-json/wp/v2/banner?_embed", { cache: "no-store" }),
          fetch("https://furssati.io/wp-json/wp/v2/mobile_banner?_embed", { cache: "no-store" }),
        ]);

        if (!desktopRes.ok || !mobileRes.ok) {
          throw new Error("فشل في جلب البانرات");
        }

        const desktopData = await desktopRes.json();
        const mobileData = await mobileRes.json();

        const desktopBanners = desktopData.map((post) => {
          const media = post?._embedded?.["wp:featuredmedia"];
          return {
            id: post.id,
            desktop: media?.[0]?.source_url || "",
          };
        });

        const mobileBanners = mobileData.map((post) => {
          const media = post?._embedded?.["wp:featuredmedia"];
          return {
            id: post.id,
            mobile: media?.[0]?.source_url || "",
          };
        });

        // الدمج حسب الترتيب
        const mergedBanners = desktopBanners.map((desktopItem, index) => ({
          id: desktopItem.id,
          desktop: desktopItem.desktop,
          mobile: mobileBanners[index]?.mobile || desktopItem.desktop,
        }));

        if (mounted) {
          setBanners(mergedBanners.filter(item => item.desktop || item.mobile));
          setIsLoading(false);
        }
      } catch (err) {
        console.error("فشل في تحميل البانرات:", err);
        if (mounted) {
          setBanners([]);
          setIsLoading(false);
        }
      }
    }

    fetchBanners();

    return () => {
      mounted = false;
    };
  }, []);

  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = (index) => {
    setCurrent(index);
  };

  useEffect(() => {
    if (isPaused || banners.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, banners.length, nextSlide]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);

    if (touchStartX.current === null || touchEndX.current === null) return;

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

  if (isLoading) {
    return (
      <div className="banner-skeleton">
        <div className="skeleton-shimmer"></div>
      </div>
    );
  }

  if (!banners.length) return null;

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
      {banners.map((banner, index) => (
        <div
          key={banner.id || index}
          className={`banner-slide ${index === current ? "active" : ""}`}
        >
          <div className="banner-image-mobile">
            <Image
              src={banner.mobile || banner.desktop}
              alt={`Banner ${index + 1}`}
              fill
              sizes="100vw"
              className="banner-image mobile-image"
              priority={index === 0}
              draggable={false}
            />
          </div>

          <div className="banner-image-desktop">
            <Image
              src={banner.desktop || banner.mobile}
              alt={`Banner ${index + 1}`}
              fill
              sizes="100vw"
              className="banner-image desktop-image"
              priority={index === 0}
              draggable={false}
            />
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            className="banner-control prev"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous Slide"
            type="button"
          >
            <ChevronLeft />
          </button>

          <button
            className="banner-control next"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next Slide"
            type="button"
          >
            <ChevronRight />
          </button>

          <div className="banner-indicators">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === current ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
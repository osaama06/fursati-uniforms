'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import "@/styles/components/BannerSlider.css";

const FRONTEND_ORIGINS = [
  "https://www.fursatiuniforms.com",
  "https://fursatiuniforms.com",
  "http://localhost:3000",
];

function normalizeBannerLink(url) {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  const matchedOrigin = FRONTEND_ORIGINS.find((origin) =>
    trimmed.startsWith(origin)
  );

  if (matchedOrigin) {
    return trimmed.replace(matchedOrigin, "") || "/";
  }

  return trimmed;
}

function isExternalBannerLink(url) {
  if (!url || typeof url !== "string") return false;

  const trimmed = url.trim();

  if (trimmed.startsWith("/")) return false;

  return !FRONTEND_ORIGINS.some((origin) => trimmed.startsWith(origin));
}

const ChevronLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    width="24"
    height="24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 19.5L8.25 12l7.5-7.5"
    />
  </svg>
);

const ChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    width="24"
    height="24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 4.5l7.5 7.5-7.5 7.5"
    />
  </svg>
);

export default function BannerSlider() {
  const [desktopBanners, setDesktopBanners] = useState([]);
  const [mobileBanners, setMobileBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchMoveX = useRef(null);
  const isSwiping = useRef(false);
  const suppressClick = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateView = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateView();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateView);
    } else {
      mediaQuery.addListener(updateView);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateView);
      } else {
        mediaQuery.removeListener(updateView);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchBanners() {
      try {
        const [desktopRes, mobileRes] = await Promise.all([
          fetch("https://furssati.io/wp-json/wp/v2/banner?_embed&per_page=100", {
            cache: "no-store",
          }),
          fetch("https://furssati.io/wp-json/wp/v2/mobile_banner?_embed&per_page=100", {
            cache: "no-store",
          }),
        ]);

        if (!desktopRes.ok || !mobileRes.ok) {
          throw new Error("فشل في جلب البانرات");
        }

        const [desktopData, mobileData] = await Promise.all([
          desktopRes.json(),
          mobileRes.json(),
        ]);

        const formattedDesktop = desktopData
          .map((post) => {
            const media = post?._embedded?.["wp:featuredmedia"];
            return {
              id: post.id,
              image: media?.[0]?.source_url || "",
              link: post?.acf?.banner_link || "",
            };
          })
          .filter((item) => item.image);

        const formattedMobile = mobileData
          .map((post) => {
            const media = post?._embedded?.["wp:featuredmedia"];
            return {
              id: post.id,
              image: media?.[0]?.source_url || "",
              link: post?.acf?.banner_link || "",
            };
          })
          .filter((item) => item.image);

        if (mounted) {
          setDesktopBanners(formattedDesktop);
          setMobileBanners(formattedMobile);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("فشل في تحميل البانرات:", error);
        if (mounted) {
          setDesktopBanners([]);
          setMobileBanners([]);
          setIsLoading(false);
        }
      }
    }

    fetchBanners();

    return () => {
      mounted = false;
    };
  }, []);

  const banners = useMemo(() => {
    return isMobile ? mobileBanners : desktopBanners;
  }, [isMobile, mobileBanners, desktopBanners]);

  useEffect(() => {
    setCurrent(0);
  }, [isMobile, desktopBanners.length, mobileBanners.length]);

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
    if (banners.length <= 1) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchMoveX.current = touch.clientX;
    isSwiping.current = true;
    suppressClick.current = false;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current) return;

    const touch = e.touches[0];
    touchMoveX.current = touch.clientX;

    const diffX = Math.abs((touchStartX.current ?? 0) - touch.clientX);
    const diffY = Math.abs((touchStartY.current ?? 0) - touch.clientY);

    if (diffX > 10 && diffX > diffY) {
      suppressClick.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    const startX = touchStartX.current;
    const endX = touchMoveX.current;

    isSwiping.current = false;
    setIsPaused(false);

    if (startX == null || endX == null) return;

    const distance = startX - endX;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(distance) >= SWIPE_THRESHOLD) {
      if (distance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    setTimeout(() => {
      suppressClick.current = false;
    }, 80);

    touchStartX.current = null;
    touchStartY.current = null;
    touchMoveX.current = null;
  };

  const handleTouchCancel = () => {
    isSwiping.current = false;
    setIsPaused(false);
    touchStartX.current = null;
    touchStartY.current = null;
    touchMoveX.current = null;

    setTimeout(() => {
      suppressClick.current = false;
    }, 80);
  };

  const handleBannerClick = (e) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      onTouchCancel={handleTouchCancel}
      role="region"
      aria-label="Promotional Banners"
    >
      {banners.map((banner, index) => {
        const rawLink =
          typeof banner.link === "string" && banner.link.trim()
            ? banner.link.trim()
            : "";

        const safeLink = normalizeBannerLink(rawLink);
        const isExternal = isExternalBannerLink(rawLink);

        const content = (
          <Image
            src={banner.image}
            alt={`Banner ${index + 1}`}
            fill
            sizes="100vw"
            className="banner-image"
            priority={index === 0}
            fetchPriority={index === 0 ? "high" : "auto"}
            draggable={false}
          />
        );

        return (
          <div
            key={banner.id || index}
            className={`banner-slide ${index === current ? "active" : ""}`}
            aria-hidden={index !== current}
          >
            {safeLink ? (
              isExternal ? (
                <a
                  href={safeLink}
                  className="banner-link-wrap"
                  aria-label={`Open banner ${index + 1}`}
                  onClick={handleBannerClick}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={safeLink}
                  className="banner-link-wrap"
                  aria-label={`Open banner ${index + 1}`}
                  onClick={handleBannerClick}
                >
                  {content}
                </Link>
              )
            ) : (
              <div
                className="banner-link-wrap"
                aria-label={`Banner ${index + 1}`}
              >
                {content}
              </div>
            )}
          </div>
        );
      })}

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
                aria-current={index === current ? "true" : "false"}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
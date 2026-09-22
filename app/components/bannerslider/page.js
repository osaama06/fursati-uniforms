'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import Image from "next/image";
import Link from "next/link";

import "@/styles/components/BannerSlider.css";

const FRONTEND_ORIGINS = [
  "https://www.fursatiuniforms.com",
  "https://www.fursatiuniforms.com",
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

  return !FRONTEND_ORIGINS.some((origin) =>
    trimmed.startsWith(origin)
  );
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

export default function BannerSlider({
  banners = [],
}) {
  const [current, setCurrent] =
    useState(0);

  const [isPaused, setIsPaused] =
    useState(false);

  const touchStartX =
    useRef(null);

  const touchStartY =
    useRef(null);

  const touchMoveX =
    useRef(null);

  const isSwiping =
    useRef(false);

  const suppressClick =
    useRef(false);

  // =============================
  // Reset slide إذا تغيرت القائمة
  // =============================
  useEffect(() => {
    setCurrent(0);
  }, [banners.length]);

  // =============================
  // Next Slide
  // =============================
  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return;

    setCurrent(
      (prev) =>
        (prev + 1) % banners.length
    );
  }, [banners.length]);

  // =============================
  // Previous Slide
  // =============================
  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return;

    setCurrent(
      (prev) =>
        (prev - 1 + banners.length) %
        banners.length
    );
  }, [banners.length]);

  // =============================
  // Go To Slide
  // =============================
  const goToSlide = (index) => {
    setCurrent(index);
  };

  // =============================
  // Auto Slide
  // =============================
  useEffect(() => {
    if (
      isPaused ||
      banners.length <= 1
    ) {
      return;
    }

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () =>
      clearInterval(interval);
  }, [
    isPaused,
    banners.length,
    nextSlide,
  ]);

  // =============================
  // Touch Start
  // =============================
  const handleTouchStart = (e) => {
    if (banners.length <= 1) return;

    const touch = e.touches[0];

    touchStartX.current =
      touch.clientX;

    touchStartY.current =
      touch.clientY;

    touchMoveX.current =
      touch.clientX;

    isSwiping.current = true;

    suppressClick.current = false;

    setIsPaused(true);
  };

  // =============================
  // Touch Move
  // =============================
  const handleTouchMove = (e) => {
    if (!isSwiping.current) return;

    const touch = e.touches[0];

    touchMoveX.current =
      touch.clientX;

    const diffX = Math.abs(
      (touchStartX.current ?? 0) -
        touch.clientX
    );

    const diffY = Math.abs(
      (touchStartY.current ?? 0) -
        touch.clientY
    );

    if (
      diffX > 10 &&
      diffX > diffY
    ) {
      suppressClick.current = true;
    }
  };

  // =============================
  // Touch End
  // =============================
  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    const startX =
      touchStartX.current;

    const endX =
      touchMoveX.current;

    isSwiping.current = false;

    setIsPaused(false);

    if (
      startX == null ||
      endX == null
    ) {
      return;
    }

    const distance =
      startX - endX;

    const SWIPE_THRESHOLD = 50;

    if (
      Math.abs(distance) >=
      SWIPE_THRESHOLD
    ) {
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

  // =============================
  // Touch Cancel
  // =============================
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

  // =============================
  // Prevent Click After Swipe
  // =============================
  const handleBannerClick = (e) => {
    if (suppressClick.current) {
      e.preventDefault();

      e.stopPropagation();
    }
  };

  // =============================
  // No Banners
  // =============================
  if (!banners.length) {
    return null;
  }

  // =============================
  // Render
  // =============================
  return (
    <div
      className="banner-slider"
      onMouseEnter={() =>
        setIsPaused(true)
      }
      onMouseLeave={() =>
        setIsPaused(false)
      }
      onTouchStart={
        handleTouchStart
      }
      onTouchMove={
        handleTouchMove
      }
      onTouchEnd={
        handleTouchEnd
      }
      onTouchCancel={
        handleTouchCancel
      }
      role="region"
      aria-label="Promotional Banners"
    >
      {banners.map(
        (banner, index) => {
          const rawLink =
            typeof banner.link ===
              "string" &&
            banner.link.trim()
              ? banner.link.trim()
              : "";

          const safeLink =
            normalizeBannerLink(
              rawLink
            );

          const isExternal =
            isExternalBannerLink(
              rawLink
            );

          const content = (
            <Image
              src={banner.image}
              alt={`Banner ${
                index + 1
              }`}
              fill
              sizes="100vw"
              className="banner-image"
              priority={
                index === 0
              }
              fetchPriority={
                index === 0
                  ? "high"
                  : "auto"
              }
              draggable={false}
            />
          );

          return (
            <div
              key={
                banner.id ||
                index
              }
              className={`banner-slide ${
                index === current
                  ? "active"
                  : ""
              }`}
              aria-hidden={
                index !== current
              }
            >
              {safeLink ? (
                isExternal ? (
                  <a
                    href={safeLink}
                    className="banner-link-wrap"
                    aria-label={`Open banner ${
                      index + 1
                    }`}
                    onClick={
                      handleBannerClick
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    href={safeLink}
                    className="banner-link-wrap"
                    aria-label={`Open banner ${
                      index + 1
                    }`}
                    onClick={
                      handleBannerClick
                    }
                  >
                    {content}
                  </Link>
                )
              ) : (
                <div
                  className="banner-link-wrap"
                  aria-label={`Banner ${
                    index + 1
                  }`}
                >
                  {content}
                </div>
              )}
            </div>
          );
        }
      )}

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
            {banners.map(
              (_, index) => (
                <button
                  key={index}
                  className={`banner-dot ${
                    index === current
                      ? "active"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();

                    goToSlide(
                      index
                    );
                  }}
                  aria-label={`Go to slide ${
                    index + 1
                  }`}
                  aria-current={
                    index === current
                      ? "true"
                      : "false"
                  }
                  type="button"
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
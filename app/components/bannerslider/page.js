//banner slider component
'use client';

import "@/styles/components/BannerSlider.css";
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function BannerSlider() {
  
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch('https://furssati.io/wp-json/wp/v2/banner?_embed');
        const data = await res.json();

        const bannerImages = data.map(post =>
          post._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
        );

        setBanners(bannerImages.filter(Boolean));
      } catch (err) {
        console.error("فشل في تحميل البانرات:", err);
      }
    }

    fetchBanners();
  }, []);

  useEffect(() => {
    if (paused || banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused, banners, current]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length);

  // if (banners.length === 0) return null;
  if (banners.length === 0) {
  return (
    <div className="banner-slider skeleton">
      <div className="skeleton-img"></div>

      <button className="left skeleton-btn">
        <FaChevronLeft size={24} />
      </button>

      <button className="right skeleton-btn">
        <FaChevronRight size={24} />
      </button>
    </div>
  );
}


  return (

    
    <div
      className="banner-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`banner-${index}`}
          className={index === current ? "active" : ""}
        />
      ))}
      <button onClick={prevSlide} className="left">
        <FaChevronLeft size={24} />
      </button>
      <button onClick={nextSlide} className="right">
        <FaChevronRight size={24} />
      </button>
    </div>
  );
}

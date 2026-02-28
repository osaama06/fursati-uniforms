"use client";

import Image from "next/image";
import { useEffect } from "react";

export default function SizeGuideModal({ image, onClose }) {

  // اغلاق بزر ESC
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={image}
          alt="Size Guide"
          width={900}
          height={900}
          loading="lazy"
          style={{ width: "100%", height: "auto" }}
        />

        <button onClick={onClose} className="close-btn">
          ✕
        </button>
      </div>
    </div>
  );
}


// app/components/WhatsAppButton.js
"use client";
 
import { useState, useEffect } from "react";
 
const WHATSAPP_NUMBER = "+966533812602"; // ← غيّر هذا برقمك
const WHATSAPP_MESSAGE = "ابغى استفسر عن"; // الرسالة الافتراضية
 
export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
 
  // يظهر الزر بعد scroll بسيط بدل ما يكون موجود من أول لحظة
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);
 
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
 
  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا عبر واتساب"
        className={`whatsapp-fab ${visible ? "whatsapp-fab--visible" : ""}`}
      >
        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="28"
          height="28"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M24 4C13 4 4 13 4 24c0 3.6 1 7 2.7 10L4 44l10.3-2.7C17.1 43 20.5 44 24 44c11 0 20-9 20-20S35 4 24 4zm0 36c-3.1 0-6.1-.8-8.7-2.4l-.6-.4-6.1 1.6 1.6-5.9-.4-.6C8.8 30.1 8 27.1 8 24 8 15.2 15.2 8 24 8s16 7.2 16 16-7.2 16-16 16zm8.7-11.8c-.5-.2-2.8-1.4-3.2-1.5-.4-.2-.7-.2-1 .2-.3.5-1.2 1.5-1.4 1.8-.3.3-.5.3-1 .1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.8-2.6-3.2-.3-.5 0-.7.2-1 .2-.2.5-.5.7-.8.2-.3.3-.5.4-.8.2-.3.1-.6 0-.8-.1-.2-1-2.5-1.4-3.4-.4-.9-.8-.8-1-.8h-.9c-.3 0-.8.1-1.2.6-.4.5-1.6 1.6-1.6 3.8s1.7 4.4 1.9 4.7c.2.3 3.3 5.1 8.1 7.1 1.1.5 2 .8 2.7 1 1.1.3 2.2.3 3 .2.9-.1 2.8-1.1 3.2-2.2.4-1.1.4-2 .3-2.2-.1-.2-.4-.3-.9-.5z" />
        </svg>
      </a>
 
      <style>{`
        .whatsapp-fab {
          position: fixed;
    bottom: 85px;
    left: 24px;
          z-index: 9999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #25D366;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.45);
          transition: transform 0.2s ease, opacity 0.4s ease, box-shadow 0.2s ease;
          opacity: 0;
          transform: scale(0.8);
          text-decoration: none;
        }
 
        .whatsapp-fab--visible {
          opacity: 1;
          transform: scale(1);
        }
 
        .whatsapp-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.6);
        }
 
        .whatsapp-fab:active {
          transform: scale(0.95);
        }
 
        /* pulse animation للفت الانتباه */
        .whatsapp-fab--visible::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #25D366;
          animation: wa-pulse 2.5s ease-out infinite;
          z-index: -1;
        }
 
        @keyframes wa-pulse {
          0%   { transform: scale(1); opacity: 0.6; }
          70%  { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </>
  );
}
 
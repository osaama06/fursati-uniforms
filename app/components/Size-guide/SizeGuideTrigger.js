"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const SizeGuideModal = dynamic(
  () => import("./SizeGuideModal"),
  { ssr: false }
);

export default function SizeGuideTrigger({ image }) {
  const [open, setOpen] = useState(false);

  if (!image) return null;

  return (
    <>
<button
  onClick={() => setOpen(true)}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "10px",
    padding: "8px 14px",
    backgroundColor: "#f5f5f5",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#333",
  }}
>
  📏 دليل المقاسات
</button>

      {open && (
        <SizeGuideModal
          image={image}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

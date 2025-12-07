// components/YoastSchema.js
export default function YoastSchema({ schema }) {
  if (!schema?.raw) return null;
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: schema.raw }}
    />
  );
}


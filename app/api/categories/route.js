// app/api/categories/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');
  
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  // أرقام فقط، بلا تكرار — بدونه القيمة تندرج في الرابط وتضيف بارامترات لـ Woo
  const safeIds = ids
    ? [...new Set(String(ids).split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s)))].join(',')
    : '';

  if (ids && !safeIds) return Response.json([]);

  const BASE = `${process.env.WOO_URL}/wp-json/wc/v3/products/categories`;

  try {
    const url = safeIds
      ? `${BASE}?include=${encodeURIComponent(safeIds)}`
      : `${BASE}?per_page=100&hide_empty=false`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store'
    });
    
    const data = await res.json();
    
    // ⭐ لو فيه IDs، ارجع الكل مو بس اللي parent-ه 27
    return Response.json(data);
    
  } catch (error) {
    return Response.json(ids ? [] : []);
  }
}
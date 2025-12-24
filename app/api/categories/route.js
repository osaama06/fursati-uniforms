// app/api/categories/route.js
export async function GET() {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");
  
  try {
    // جلب 100 تصنيف لضمان وجود الـ ID 27 والـ ID 59 وكل أبنائهم
    const res = await fetch(
      "https://furssati.io/wp-json/wc/v3/products/categories?per_page=100&hide_empty=false",
      {
        headers: { Authorization: `Basic ${auth}` },
        cache: 'no-store' 
      }
    );
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json([]);
  }
}
// app/api/categories/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');
  
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");

  try {
    const url = ids 
      ? `https://furssati.io/wp-json/wc/v3/products/categories?include=${ids}`
      : "https://furssati.io/wp-json/wc/v3/products/categories?per_page=100&hide_empty=false";
    
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
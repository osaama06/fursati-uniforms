export const getProductBySlug = async (slug) => {
    const res = await fetch(`https://fursatiuniforms.store/wp-json/wc/v3/products?slug=${slug}&consumer_key=YOUR_CONSUMER_KEY&consumer_secret=YOUR_CONSUMER_SECRET`);
    const data = await res.json();
    return data[0]; // افترض أن المنتج الذي تحتاجه هو أول عنصر في المصفوفة
  };

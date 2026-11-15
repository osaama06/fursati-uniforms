import { NextResponse } from 'next/server';

const MAX_ITEMS = 6;
const WOO_BASE = 'https://fursatiuniforms.store/wp-json/wc/v3';

function authHeaders() {
  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString('base64');
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  };
}

// Only the variation fields the "complete the look" box needs
function trimVariation(v) {
  return {
    id: v.id,
    price: v.price,
    regular_price: v.regular_price,
    sale_price: v.sale_price,
    stock_status: v.stock_status,
    purchasable: v.purchasable,
    image: v.image ? { src: v.image.src, alt: v.image.alt } : null,
    attributes: (v.attributes || []).map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      option: a.option,
    })),
  };
}

async function fetchVariations(productId, headers) {
  const res = await fetch(
    `${WOO_BASE}/products/${productId}/variations?per_page=100&status=publish`,
    { headers, cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map(trimVariation) : [];
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids') || '';

    // Accept only numeric IDs, no duplicates, capped
    const ids = [...new Set(
      idsParam
        .split(',')
        .map((id) => id.trim())
        .filter((id) => /^\d+$/.test(id))
    )].slice(0, MAX_ITEMS);

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const headers = authHeaders();

    // orderby=include keeps the same order you set in WordPress "Cross-sells"
    const url = `${WOO_BASE}/products?include=${ids.join(',')}&per_page=${ids.length}&orderby=include&status=publish`;

    const response = await fetch(url, { headers, cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const products = await response.json();

    // Only visible, published, in-stock products
    const availableProducts = products.filter((product) =>
      product.status === 'publish' &&
      product.catalog_visibility !== 'hidden' &&
      product.stock_status !== 'outofstock'
    );

    // Variable products need their variations so the customer can pick size/color inline
    const withVariations = await Promise.all(
      availableProducts.map(async (product) => ({
        ...product,
        variations_data: product.type === 'variable'
          ? await fetchVariations(product.id, headers)
          : [],
      }))
    );

    return NextResponse.json(withVariations);

  } catch (error) {
    console.error('Error fetching cross-sell products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cross-sell products' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';

const MAX_ITEMS = 12;

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

    const auth = Buffer.from(
      `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
    ).toString('base64');

    // orderby=include keeps the same order you set in WordPress "Cross-sells"
    const url = `https://fursatiuniforms.store/wp-json/wc/v3/products?include=${ids.join(',')}&per_page=${ids.length}&orderby=include&status=publish`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

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

    return NextResponse.json(availableProducts);

  } catch (error) {
    console.error('Error fetching cross-sell products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cross-sell products' },
      { status: 500 }
    );
  }
}

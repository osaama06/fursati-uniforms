import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const excludeId = searchParams.get('exclude');
    const perPage = searchParams.get('per_page') || '8';

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const auth = Buffer.from(
      `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
    ).toString('base64');

    let url = `https://fursatiuniforms.store/wp-json/wc/v3/products?category=${categoryId}&per_page=${perPage}&status=publish`;

    if (excludeId) {
      url += `&exclude=${excludeId}`;
    }

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

    // فلترة المنتجات المتاحة فقط
    const availableProducts = products.filter(product =>
      product.status === 'publish' &&
      product.catalog_visibility !== 'hidden'
    );

    return NextResponse.json(availableProducts);

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
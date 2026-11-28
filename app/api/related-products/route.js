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

    // أرقام فقط — بدونه القيم تندرج في الرابط وتضيف بارامترات لـ Woo
    if (!/^\d+$/.test(String(categoryId))) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const safePerPage = /^\d+$/.test(String(perPage))
      ? String(Math.min(Math.max(parseInt(perPage, 10), 1), 100))
      : '8';

    const safeExclude = excludeId
      ? [...new Set(String(excludeId).split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s)))].join(',')
      : '';

    const auth = Buffer.from(
      `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
    ).toString('base64');

    let url = `${process.env.WOO_URL}/wp-json/wc/v3/products?category=${encodeURIComponent(categoryId)}&per_page=${encodeURIComponent(safePerPage)}&status=publish`;

    if (safeExclude) {
      url += `&exclude=${encodeURIComponent(safeExclude)}`;
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
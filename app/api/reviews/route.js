// app/api/reviews/route.js

// سقف أعلى فقط — ما فيه حد أدنى، تعليق بكلمة واحدة مقبول
const MAX_COMMENT = 1000;
const MAX_NAME = 100;
const MAX_EMAIL = 200;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return Response.json({ error: 'Product ID is required' }, { status: 400 });
  }

  // رقم فقط — بدونه القيمة تندرج في الرابط وتضيف بارامترات لـ Woo
  if (!/^\d+$/.test(String(productId))) {
    return Response.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString('base64');

  try {
    const response = await fetch(
      `${process.env.WOO_URL}/wp-json/wc/v3/products/reviews?product=${encodeURIComponent(productId)}&per_page=100`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        cache: 'no-store', // ⭐ مهم جداً - ما نخزن cache
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }

    const reviews = await response.json();

    // حساب الإحصائيات
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      const rating = parseInt(review.rating);
      breakdown[rating] = (breakdown[rating] || 0) + 1;
      totalRating += rating;
    });

    const average = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    return Response.json({
      reviews,
      stats: {
        total: reviews.length,
        average: parseFloat(average),
        breakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return Response.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const body = await request.json();
  const { product_id, rating, comment, reviewer_name, reviewer_email } = body;

  if (!product_id || !rating || !comment || !reviewer_name || !reviewer_email) {
    return Response.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  if (!/^\d+$/.test(String(product_id))) {
    return Response.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  // سقف أعلى فقط — التعليق القصير مقبول
  if (String(comment).length > MAX_COMMENT) {
    return Response.json(
      { error: `التعليق طويل جداً — الحد الأقصى ${MAX_COMMENT} حرف` },
      { status: 400 }
    );
  }
  if (String(reviewer_name).length > MAX_NAME || String(reviewer_email).length > MAX_EMAIL) {
    return Response.json({ error: 'الاسم أو البريد طويل جداً' }, { status: 400 });
  }

  const auth = Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString('base64');

  try {
    const response = await fetch(
      `${process.env.WOO_URL}/wp-json/wc/v3/products/reviews`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: parseInt(product_id),
          review: comment,
          reviewer: reviewer_name,
          reviewer_email: reviewer_email,
          rating: parseInt(rating),
          // الافتراضي في Woo هو approved — أي نشر فوري بلا مراجعة.
          // hold = بانتظار المراجعة، والتقييم ما يظهر لين يُعتمد يدوياً.
          status: 'hold',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit review');
    }

    // التقييم بحالة hold، والـ GET يرجّع المعتمد فقط — فما يظهر الحين.
    // الرسالة لازم تقول كذا عشان العميل ما يستغرب.
    return Response.json({
      success: true,
      message: 'تم إرسال تقييمك وسيظهر بعد المراجعة',
      review: data,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return Response.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
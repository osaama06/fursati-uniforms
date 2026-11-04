// app/api/create-order/route.js
// ─────────────────────────────────────────────────────────────────────────────
// مصدر الحقيقة للأسعار: السيرفر فقط.
// - سعر المنتج/الـ variation ينجاب من WooCommerce
// - أسعار الإضافات (تطريز، تفصيل...) تنحسب من custom_product_fields_json
// - الكوبون يتحقق منه WooCommerce نفسه عبر coupon_lines
// أي سعر يجي من المتصفح يتم تجاهله.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import woocommerceApi from '@/lib/woocommerce';
import { verifyAppToken } from '@/lib/auth';

const sanitize = (str) => String(str ?? '').trim().replace(/<[^>]*>/g, '').slice(0, 500);
const round2 = (n) => Math.round(n * 100) / 100;

// ─── قواعد الشحن ─────────────────────────────────────────────────────────────
const SHIPPING_FLAT = 23;
const COD_FEE = 10; // رسوم الدفع عند الاستلام
const FREE_SHIPPING_THRESHOLD = 300;

// ─── حدود ─────────────────────────────────────────────────────────────────────
const MAX_QTY_PER_LINE = 50;
const MAX_LINES = 30;
const MIN_CARD_AMOUNT_HALALAS = 100; // أقل مبلغ يقبله ميسر = 1 ريال

class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// ─── أخطاء WooCommerce ───────────────────────────────────────────────────────
// 404 = المنتج فعلاً غير موجود. غيره (timeout، 401، 500) = مشكلة اتصال/إعدادات.
const isNotFound = (err) => err?.response?.status === 404;
const describeWooError = (err) =>
  err?.response
    ? { status: err.response.status, data: err.response.data }
    : { code: err?.code || err?.cause?.code, message: err?.message };

// ─── مطابقة الـ variation من اختيارات العميل ─────────────────────────────────
// نفس منطق صفحة المنتج: تجاهل المسافات والشرطات وحالة الأحرف
const normalizeText = (v = '') =>
  String(v).trim().toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');

const stripPa = (v = '') => normalizeText(v).replace(/^pa/, '');

function findProductAttr(product, vAttr) {
  return (product.attributes || []).find(
    (a) =>
      (vAttr.id && a.id === vAttr.id) ||
      normalizeText(a.name) === normalizeText(vAttr.name) ||
      stripPa(a.slug) === stripPa(vAttr.name)
  );
}

// الكرت يحفظ الاختيار بـ attr.name، وصفحة المنتج بـ attr.slug أو attr.name
function getClientAttr(clientAttrs, vAttr, pAttr) {
  const candidates = [pAttr?.slug, pAttr?.name, vAttr?.name, vAttr?.slug]
    .filter(Boolean)
    .map(stripPa);
  for (const [key, value] of Object.entries(clientAttrs || {})) {
    if (candidates.includes(stripPa(key))) return sanitize(value);
  }
  return '';
}

async function resolveVariationFromAttrs(product, clientAttrs) {
  const { data: variations } = await woocommerceApi.get(`products/${product.id}/variations`, {
    per_page: 100,
  });

  return (variations || []).find((variation) =>
    (variation.attributes || []).every((vAttr) => {
      const pAttr = findProductAttr(product, vAttr);
      const chosen = getClientAttr(clientAttrs, vAttr, pAttr);
      if (!chosen) return false;
      if (!vAttr.option) return true; // "Any"
      return normalizeText(vAttr.option) === normalizeText(chosen);
    })
  ) || null;
}

// ─── الحقول المخصصة ──────────────────────────────────────────────────────────
function parseCustomFieldDefs(product) {
  const raw = product?.meta_data?.find((m) => m.key === 'custom_product_fields_json')?.value;
  if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const optionLabel = (opt) => (typeof opt === 'string' ? opt : opt?.label);
const optionPrice = (opt) => (typeof opt === 'string' ? 0 : Number(opt?.price) || 0);

/**
 * يحسب سعر الإضافات من تعريف المنتج، ويبني meta_data للطلب.
 * العميل يرسل اختياراته (labels) فقط — السعر ما ناخذه منه.
 */
function priceCustomFields(defs, submitted, productName) {
  let extra = 0;
  const meta = [];

  for (const field of defs) {
    const label = field.field_label || field.field_key;
    const options = Array.isArray(field.field_options) ? field.field_options : [];
    const entry = submitted?.[field.field_key];
    const rawValue = entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry;
    const value = rawValue === undefined || rawValue === null ? '' : String(rawValue).trim();

    // الحقول الإلزامية يتحقق منها صفحة المنتج — هنا نحسب السعر فقط
    if (!value) continue;

    switch (field.field_type) {
      case 'radio': {
        const match = options.find((o) => optionLabel(o) === value);
        // الخيار ما عاد موجود في المنتج (غالباً تعدّل اسمه) — ما نقدر نعرف سعره
        if (!match) throw new OrderError(`الخيار "${value}" في "${label}" تغيّر — احذف "${productName}" من السلة وأضفه من جديد`);
        const price = optionPrice(match);
        extra += price;
        meta.push({ key: label, value: price > 0 ? `${value} (+${price} ر.س)` : value });
        break;
      }

      case 'checkbox': {
        // الكارت يحفظ الاختيارات مدموجة بـ " / "
        const parts = value.split(' / ').map((s) => s.trim()).filter(Boolean);
        let sum = 0;
        for (const part of parts) {
          const match = options.find((o) => optionLabel(o) === part);
          if (!match) throw new OrderError(`الخيار "${part}" في "${label}" تغيّر — احذف "${productName}" من السلة وأضفه من جديد`);
          sum += optionPrice(match);
        }
        extra += sum;
        meta.push({ key: label, value: sum > 0 ? `${value} (+${sum} ر.س)` : value });
        break;
      }

      case 'image': {
        meta.push({ key: label, value: value.slice(0, 500) });
        break;
      }

      default: {
        // text / number / textarea / measurements — بدون سعر
        meta.push({ key: label, value: sanitize(value) });
      }
    }
  }

  return { extra, meta };
}

// ─── بناء line_items بأسعار السيرفر ──────────────────────────────────────────
async function buildLineItems(cartItems) {
  const productCache = new Map();
  const getProduct = (id) => {
    if (!productCache.has(id)) {
      productCache.set(id, woocommerceApi.get(`products/${id}`).then((r) => r.data));
    }
    return productCache.get(id);
  };

  const lineItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const productId = parseInt(item.productId || item.id, 10);
    const variationId = parseInt(item.variationId || 0, 10) || 0;
    const quantity = parseInt(item.quantity, 10);

    if (!productId) throw new OrderError('منتج غير صالح في السلة');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
      throw new OrderError('كمية غير صالحة في السلة');
    }

    let product;
    try {
      product = await getProduct(productId);
    } catch (err) {
      if (isNotFound(err)) throw new OrderError('أحد المنتجات في السلة لم يعد متوفراً');
      console.error(`❌ فشل جلب المنتج ${productId}:`, describeWooError(err));
      throw new OrderError('تعذّر الاتصال بالمتجر، حاول مرة ثانية', 503);
    }
    // ملاحظة: ما نتحقق من المخزون — فرصتي تصنّع منتجاتها والمخزون في WooCommerce مو مرجع.
    // التحقق الوحيد هنا هو السعر.

    let basePrice;
    let resolvedVariationId = 0;
    const attrMeta = [];

    const hasVariations = product.type === 'variable' && (product.variations || []).length > 0;

    const clientAttrs = item.selectedAttributes || {};
    let variation = null;

    if (hasVariations) {
      try {
        if (variationId) {
          // جاي من صفحة المنتج — معه variationId
          const { data } = await woocommerceApi.get(`products/${productId}/variations/${variationId}`);
          variation = data;
        } else {
          // جاي من كرت المنتج (الإضافة السريعة) — معه المقاس/اللون بدون variationId
          variation = await resolveVariationFromAttrs(product, clientAttrs);
        }
      } catch (err) {
        if (!isNotFound(err)) {
          console.error(`❌ فشل جلب variations المنتج ${productId}:`, describeWooError(err));
          throw new OrderError('تعذّر الاتصال بالمتجر، حاول مرة ثانية', 503);
        }
        variation = null;
      }
      if (!variation) {
        console.warn(`⚠️ ما لقينا variation مطابقة للمنتج ${productId} — استخدمنا سعر المنتج:`, clientAttrs);
      }
    }

    if (variation) {
      // ─── مربوط بـ variation: سعرها وخصائصها من WooCommerce ───
      resolvedVariationId = variation.id;
      const vPrice = parseFloat(variation.price);
      basePrice = Number.isFinite(vPrice) && vPrice > 0 ? vPrice : parseFloat(product.price);

      for (const vAttr of variation.attributes || []) {
        if (vAttr.option) {
          attrMeta.push({ key: vAttr.name, value: vAttr.option });
          continue;
        }
        // خيار "Any" — ناخذ اختيار العميل
        const pAttr = findProductAttr(product, vAttr);
        const chosen = getClientAttr(clientAttrs, vAttr, pAttr);
        if (chosen) {
          const canonical = (pAttr?.options || []).find((o) => normalizeText(o) === normalizeText(chosen));
          attrMeta.push({ key: vAttr.name, value: canonical || chosen.slice(0, 100) });
        }
      }
    } else {
      // ─── بدون variation: نفس سلوك الكود القديم — سعر المنتج + الاختيارات كنص ───
      basePrice = parseFloat(product.price);
      for (const [key, rawValue] of Object.entries(clientAttrs)) {
        const value = sanitize(rawValue);
        if (!value) continue;
        const pAttr = (product.attributes || []).find((a) => a.slug === key || a.name === key);
        attrMeta.push({
          key: pAttr ? pAttr.name : sanitize(key).slice(0, 100),
          value: value.slice(0, 100),
        });
      }
    }

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      throw new OrderError(`سعر "${product.name}" غير متاح حالياً`);
    }

    const defs = parseCustomFieldDefs(product);
    const { extra, meta } = priceCustomFields(defs, item.customFields, product.name);

    const unitPrice = round2(basePrice + extra);
    const lineTotal = round2(unitPrice * quantity);
    subtotal = round2(subtotal + lineTotal);

    lineItems.push({
      product_id: productId,
      variation_id: resolvedVariationId,
      quantity,
      subtotal: lineTotal.toFixed(2),
      total: lineTotal.toFixed(2),
      meta_data: [...attrMeta, ...meta],
    });
  }

  return { lineItems, subtotal };
}

// ─── Route ───────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { cartItems } = body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 });
    }
    if (cartItems.length > MAX_LINES) {
      return NextResponse.json({ error: 'عدد المنتجات في السلة كبير جداً' }, { status: 400 });
    }

    const address  = sanitize(body.address);
    const city     = sanitize(body.city);
    const state    = sanitize(body.state);
    const postcode = sanitize(body.postcode);
    const phone    = sanitize(body.phone);
    const country  = 'SA';
    const couponCode = body.coupon_code ? sanitize(body.coupon_code).slice(0, 50) : null;
    const isCard = body.payment_method === 'card';

    if (!phone || !address || !city || !postcode) {
      return NextResponse.json({ error: 'أكمل بيانات العنوان' }, { status: 400 });
    }

    // ─── المستخدم ───
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'المستخدم غير مسجل الدخول' }, { status: 401 });

    const payload = await verifyAppToken(token);
    if (!payload) return NextResponse.json({ error: 'توكن غير صالح' }, { status: 401 });

    // نفس ترتيب api/my-orders عشان الطلب يظهر في "طلباتي"
    const customer_id = payload.customer_id || payload?.data?.user?.id || payload.customerId || payload.id || 0;
    const customerName = payload.displayName || payload.name || 'عميل';

    // ─── الأسعار من السيرفر ───
    const { lineItems, subtotal } = await buildLineItems(cartItems);
    const shippingTotal = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

    const orderData = {
      payment_method:       isCard ? 'moyasar' : 'cod',
      payment_method_title: isCard ? 'بطاقة / مدى (ميسر)' : 'الدفع عند الاستلام',
      set_paid:             false,
      // البطاقة: pending لين يتأكد الدفع من ميسر
      // الاستلام: processing على طول — جاهز للتجهيز والشحن (نفس سلوك WooCommerce الافتراضي)
      status:               isCard ? 'pending' : 'processing',
      customer_id,
      billing: {
        first_name: customerName,
        last_name:  '',
        email:      payload.email || 'noemail@example.com',
        phone,
        address_1:  address,
        city,
        state,
        postcode,
        country,
      },
      shipping: {
        first_name: customerName,
        last_name:  '',
        phone,
        address_1:  address,
        city,
        state,
        postcode,
        country,
      },
      line_items: lineItems,
      shipping_lines: [
        {
          method_id:    shippingTotal === 0 ? 'free_shipping' : 'flat_rate',
          method_title: shippingTotal === 0 ? 'شحن مجاني' : 'الشحن',
          total:        shippingTotal.toFixed(2),
        },
      ],
      // رسوم الدفع عند الاستلام — تنضاف للإجمالي وتظهر في الطلب
      ...(!isCard ? {
        fee_lines: [{
          name:       'رسوم الدفع عند الاستلام',
          total:      COD_FEE.toFixed(2),
          tax_status: 'none',
        }],
      } : {}),
      // WooCommerce يتحقق من الكوبون (الانتهاء، حد الاستخدام، الحد الأدنى...) ويحسب الخصم
      ...(couponCode ? { coupon_lines: [{ code: couponCode }] } : {}),
    };

    let order;
    try {
      const { data } = await woocommerceApi.post('orders', orderData);
      order = data;
    } catch (err) {
      const wooErr = err.response?.data;
      if (couponCode && String(wooErr?.code || '').includes('coupon')) {
        return NextResponse.json(
          { error: wooErr?.message?.replace(/<[^>]*>/g, '') || 'الكوبون غير صالح' },
          { status: 400 }
        );
      }
      throw err;
    }

    const total = parseFloat(order.total);
    const amountHalalas = Math.round(total * 100);

    if (isCard && amountHalalas < MIN_CARD_AMOUNT_HALALAS) {
      await woocommerceApi.put(`orders/${order.id}`, { status: 'cancelled' }).catch(() => {});
      return NextResponse.json(
        { error: 'المبلغ أقل من الحد الأدنى للدفع بالبطاقة، اختر الدفع عند الاستلام' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id:       order.id,
        number:   order.number,
        total:    total.toFixed(2),
        currency: order.currency || 'SAR',
      },
      payment: isCard
        ? {
            amount:      amountHalalas,
            currency:    order.currency || 'SAR',
            description: `طلب رقم ${order.number} — فرصتي`,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('❌ خطأ أثناء إنشاء الطلب:', error.response?.data || error.message);
    return NextResponse.json({ error: 'فشل إنشاء الطلب، حاول مرة أخرى' }, { status: 500 });
  }
}     
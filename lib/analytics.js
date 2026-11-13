'use client';
// lib/analytics.js
// كل أحداث المتجر تمر من هنا وتروح لـ GA4 + بكسل سناب + بكسل ميتا (اللي مركّب منهم)

const CURRENCY = 'SAR';
const TRACKED_KEY = 'fursati_tracked_orders';
const PENDING_KEY = 'fursati_pending_order';

function send(ga4Event, ga4Params, snapEvent, snapParams, fbEvent, fbParams) {
  if (typeof window === 'undefined') return;

  // لو GA ما تحمّل للحين (ينتظر تفاعل)، نحمّله الحين عشان الحدث ما يضيع
  if (typeof window.__loadGA === 'function') window.__loadGA();

  try { window.gtag?.('event', ga4Event, ga4Params); } catch {}
  try { if (snapEvent) window.snaptr?.('track', snapEvent, snapParams); } catch {}
  try { if (fbEvent) window.fbq?.('track', fbEvent, fbParams); } catch {}
}

function toGaItem(item) {
  const attrs = Object.values(item.selectedAttributes || {}).filter(Boolean).join(' / ');
  return {
    item_id: String(item.productId || item.id),
    item_name: item.name,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    ...(attrs ? { item_variant: attrs } : {}),
  };
}

function sumItems(items) {
  return items.reduce((t, i) => t + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
}

// ─── إضافة للسلة ───
export function trackAddToCart(item) {
  const gaItem = toGaItem({ ...item, quantity: 1 });
  send(
    'add_to_cart',
    { currency: CURRENCY, value: gaItem.price, items: [gaItem] },
    'ADD_CART',
    { price: gaItem.price, currency: CURRENCY, item_ids: [gaItem.item_id], number_items: 1 },
    'AddToCart',
    { value: gaItem.price, currency: CURRENCY, content_ids: [gaItem.item_id], content_type: 'product' }
  );
}

// ─── بداية الدفع ───
export function trackBeginCheckout(cartItems) {
  if (!cartItems?.length) return;
  const items = cartItems.map(toGaItem);
  const value = sumItems(items);
  send(
    'begin_checkout',
    { currency: CURRENCY, value, items },
    'START_CHECKOUT',
    { price: value, currency: CURRENCY, item_ids: items.map((i) => i.item_id), number_items: items.length },
    'InitiateCheckout',
    { value, currency: CURRENCY, content_ids: items.map((i) => i.item_id), num_items: items.length }
  );
}

// ─── نحفظ الطلب قبل ما يطلع العميل لميسر، عشان نعرف قيمته بعد ما يرجع ───
export function savePendingOrder(orderId, total, cartItems) {
  try {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ orderId: String(orderId), total: Number(total) || 0, items: cartItems.map(toGaItem) })
    );
  } catch {}
}

// ─── شراء — ينرسل مرة وحدة بس لكل طلب ───
export function trackPurchase(orderId, fallbackTotal) {
  if (!orderId || typeof window === 'undefined') return;
  const id = String(orderId);

  let tracked = [];
  try { tracked = JSON.parse(localStorage.getItem(TRACKED_KEY) || '[]'); } catch {}
  if (tracked.includes(id)) return; // تحديث الصفحة ما يكرر الطلب

  let pending = null;
  try { pending = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); } catch {}
  if (pending?.orderId !== id) pending = null;

  const items = pending?.items || [];
  const value = Number(pending?.total) || Number(fallbackTotal) || sumItems(items);

  send(
    'purchase',
    { transaction_id: id, currency: CURRENCY, value, items },
    'PURCHASE',
    { price: value, currency: CURRENCY, transaction_id: id, item_ids: items.map((i) => i.item_id), number_items: items.length },
    'Purchase',
    { value, currency: CURRENCY, content_ids: items.map((i) => i.item_id), content_type: 'product' }
  );

  try {
    localStorage.setItem(TRACKED_KEY, JSON.stringify([...tracked, id].slice(-20)));
    localStorage.removeItem(PENDING_KEY);
  } catch {}
}

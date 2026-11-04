// app/orders/orderStatus.js
// مصدر واحد لأسماء الحالات ومراحل التتبع — تستخدمه صفحة الطلبات وصفحة تفاصيل الطلب

export const STATUS_INFO = {
  pending:          { label: 'بانتظار الدفع', color: '#f08c00', bg: '#fff9db' },
  processing:       { label: 'قيد التجهيز',   color: '#1c7ed6', bg: '#e7f5ff' },
  shipped:          { label: 'تم الشحن',      color: '#7048e8', bg: '#f3f0ff' },
  completed:        { label: 'تم التسليم',    color: '#0ca678', bg: '#e6fcf5' },
  'on-hold':        { label: 'قيد المراجعة',  color: '#ae3ec9', bg: '#f8f0fc' },
  cancelled:        { label: 'ملغي',          color: '#e03131', bg: '#fff5f5' },
  refunded:         { label: 'مسترجع',        color: '#748ffc', bg: '#edf2ff' },
  failed:           { label: 'فشل الدفع',     color: '#fa5252', bg: '#fff5f5' },
  'checkout-draft': { label: 'مسودة',         color: '#868e96', bg: '#f1f3f5' },
};

export const getStatusInfo = (status) =>
  STATUS_INFO[status] || { label: status, color: '#495057', bg: '#f1f3f5' };

// مراحل التتبع الأربع
export const STEPS = ['تم الطلب', 'قيد التجهيز', 'تم الشحن', 'تم التسليم'];

/**
 * رقم آخر مرحلة مكتملة (0 → 3)، أو null للحالات اللي ما لها تتبع (ملغي، مسترجع، فشل)
 */
export function getStage(status) {
  switch (status) {
    case 'pending':
    case 'on-hold':
      return 0;
    case 'processing':
      return 1;
    case 'shipped':
      return 2;
    case 'completed':
      return 3;
    default:
      return null;
  }
}

/**
 * طلبات ما يحتاج العميل يشوفها في قائمته:
 * محاولات دفع بالبطاقة فشلت أو ما اكتملت
 */
export function isHiddenFromCustomer(order) {
  if (order.status === 'failed' || order.status === 'checkout-draft') return true;
  if (order.status === 'pending' && order.payment_method === 'moyasar') return true;
  return false;
}
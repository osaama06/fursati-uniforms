// lib/shortNationalAddress.js
// ─────────────────────────────────────────────────────────────────────────────
// قاعدة التحقق الموحّدة للعنوان الوطني المختصر (مثال: ABCD1234) — تُستخدم من
// صفحة العناوين (client)، صفحة الدفع (client)، ومن مسار حفظ العنوان (server).
// دوال نقية بدون أي اعتماد على next/headers أو أي شيء خاص بالسيرفر، فهي آمنة
// للاستيراد من أي مكان.
// ─────────────────────────────────────────────────────────────────────────────

export const SHORT_NATIONAL_ADDRESS_REGEX = /^[A-Z]{4}[0-9]{4}$/;

/**
 * تحوّل القيمة لصيغتها القانونية: تكبير الأحرف، وحذف أي مسافات أو شرطات
 * (بينهما أو في أي مكان آخر بالنص).
 */
export function normalizeShortNationalAddress(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '');
}

/**
 * يتحقق من إن القيمة (بعد التطبيع) تطابق صيغة 4 أحرف إنجليزية + 4 أرقام.
 */
export function isValidShortNationalAddress(value) {
  return SHORT_NATIONAL_ADDRESS_REGEX.test(normalizeShortNationalAddress(value));
}

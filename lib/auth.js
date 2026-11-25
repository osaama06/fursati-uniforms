// lib/auth.js
import jwt from 'jsonwebtoken';

/**
 * سر التوكن — يُقرأ من البيئة فقط، ما فيه قيمة احتياطية.
 * الفحص وقت الاستدعاء (مو على مستوى الوحدة) عشان ما يكسر الـ build.
 */
function getSecret() {
  const secret = process.env.WT_SECRET;
  if (!secret) throw new Error('WT_SECRET is not set — المصادقة معطّلة');
  return secret;
}

/**
 * إنشاء JWT Token
 */
export function createAppToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

/**
 * التحقق من صحة Token — يرجّع الحمولة، أو null لو التوكن منتهي/مزوّر.
 * ملاحظة: getSecret() يُستدعى برا الـ try عشان خطأ الإعداد ينتشر
 * ولا يتحول لـ "توكن غير صالح".
 */
export function verifyAppToken(token) {
  const secret = getSecret();
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

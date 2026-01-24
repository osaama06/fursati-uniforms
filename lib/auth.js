// lib/auth.js
import jwt from 'jsonwebtoken';

const secret = process.env.WT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987';

/**
 * إنشاء JWT Token
 */
export function createAppToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * التحقق من صحة Token
 */
export function verifyAppToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
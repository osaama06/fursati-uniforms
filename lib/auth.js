import jwt from 'jsonwebtoken';

const secret = process.env.WT_SECRET || '@#Yt5$Dsdg6@!#dfghASD987';

export function createAppToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyAppToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
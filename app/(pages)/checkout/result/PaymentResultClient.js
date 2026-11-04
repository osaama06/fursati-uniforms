'use client';
// app/checkout/result/PaymentResultClient.js
import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/app/context/CartContext';
import styles from '@/styles/pages/checkOut.module.css';

const CONTENT = {
  paid: {
    icon: '✅',
    title: 'تم الدفع بنجاح',
    text: 'شكراً لك! استلمنا طلبك وبنبدأ نجهّزه.',
    color: '#276749',
  },
  cod: {
    icon: '✅',
    title: 'تم استلام طلبك',
    text: 'بنجهّز طلبك ونتواصل معك قبل التوصيل.',
    color: '#276749',
  },
  confirming: {
    icon: '✅',
    title: 'تم الدفع بنجاح',
    text: 'استلمنا الدفع ونأكد طلبك الحين. بيظهر في طلباتك خلال دقائق، لا تعيد الدفع.',
    color: '#276749',
  },
  review: {
    icon: '🕓',
    title: 'استلمنا الدفع وطلبك قيد المراجعة',
    text: 'بنتواصل معك قريباً لتأكيد الطلب.',
    color: '#b7791f',
  },
  failed: {
    icon: '❌',
    title: 'لم تتم عملية الدفع',
    text: 'ما انخصم منك أي مبلغ. منتجاتك باقية في السلة، تقدر تحاول مرة ثانية.',
    color: '#c53030',
  },
  invalid: {
    icon: '⚠️',
    title: 'تعذّر التحقق من الدفع',
    text: 'إذا انخصم منك مبلغ تواصل معنا وبنحل الموضوع.',
    color: '#c53030',
  },
  error: {
    icon: '⚠️',
    title: 'صار خطأ أثناء التحقق من الدفع',
    text: 'إذا انخصم منك مبلغ لا تعيد الدفع، تواصل معنا وبنتأكد من طلبك.',
    color: '#c53030',
  },
};

// رسائل الرفض من ميسر/البنك تجي بالإنجليزي — نترجمها للعميل
const DECLINE_REASONS = [
  [/insufficient/i,                         'الرصيد غير كافٍ في البطاقة'],
  [/expired/i,                              'البطاقة منتهية الصلاحية'],
  [/invalid card|not found|card number/i,   'بيانات البطاقة غير صحيحة، تأكد من الرقم وتاريخ الانتهاء'],
  [/cvv|cvc|security code/i,                'رمز التحقق (CVV) غير صحيح'],
  [/3d|authenticat|otp/i,                   'ما اكتمل التحقق من البنك (رمز التحقق)'],
  [/limit|exceed/i,                         'العملية تتجاوز حد البطاقة'],
  [/not permitted|not allowed|restricted|online/i, 'البطاقة غير مفعّلة للشراء عبر الإنترنت'],
  [/timeout|timed out/i,                    'انتهت مهلة العملية، حاول مرة ثانية'],
  [/cancel|abandon/i,                       'تم إلغاء عملية الدفع'],
  [/do not honor|declined|reject/i,         'البنك رفض العملية، تواصل مع بنكك أو جرّب بطاقة ثانية'],
];

function translateReason(message) {
  if (!message) return null;
  const match = DECLINE_REASONS.find(([re]) => re.test(message));
  return match ? match[1] : 'البنك رفض العملية، جرّب بطاقة ثانية أو اختر الدفع عند الاستلام';
}

export default function PaymentResultClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const cleared = useRef(false);

  const status = params.get('status') || 'error';
  const order = params.get('order');
  const message = params.get('message');
  const c = CONTENT[status] || CONTENT.error;

  const total = params.get('total');

  // الطلب انعمل فعلاً (مدفوع أو استلام) → نفضّي السلة ونوجّهه لطلباته
  const moneyTaken = ['paid', 'review', 'confirming', 'cod'].includes(status);

  useEffect(() => {
    if (moneyTaken && !cleared.current) {
      cleared.current = true;
      clearCart();
    }
  }, [moneyTaken, clearCart]);

  return (
    <div dir="rtl" className={styles.checkoutPage} style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>{c.icon}</div>
      <h1 style={{ color: c.color, marginBottom: '12px' }}>{c.title}</h1>
      {order && (
        <p style={{ fontWeight: 700, marginBottom: '8px' }}>رقم الطلب: #{order}</p>
      )}
      <p style={{ color: '#4a5568', marginBottom: '8px' }}>{c.text}</p>
      {status === 'cod' && total && (
        <p style={{
          display: 'inline-block', background: '#f0f4ff', border: '1px solid #c3d4f7',
          borderRadius: '12px', padding: '10px 18px', marginTop: '8px', fontWeight: 700, color: '#1B365D',
        }}>
          💵 المبلغ المطلوب عند الاستلام: {parseFloat(total).toFixed(2)} ر.س
        </p>
      )}
      {status === 'failed' && message && (
        <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '8px' }}>السبب: {translateReason(message)}</p>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
        {moneyTaken ? (
          <button
            onClick={() => router.push('/orders?new=true')}
            className={styles.checkoutButton}
            style={{ maxWidth: '220px' }}
          >
            عرض طلباتي
          </button>
        ) : (
          <button
            onClick={() => router.push('/checkout')}
            className={styles.checkoutButton}
            style={{ maxWidth: '220px' }}
          >
            حاول مرة أخرى
          </button>
        )}
        <button
          onClick={() => router.push('/')}
          className={styles.checkoutButton}
          style={{ maxWidth: '220px', background: '#fff', color: '#1B365D', border: '2px solid #1B365D' }}
        >
          العودة للتسوق
        </button>
      </div>
    </div>
  );
}
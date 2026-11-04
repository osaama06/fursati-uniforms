'use client';
import { useCart } from '../../context/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from '@/styles/pages/checkOut.module.css';

// ─── Moyasar Form ────────────────────────────────────────────────────────────
const MOYASAR_VERSION = '1.15.0';
const MOYASAR_JS  = `https://cdn.moyasar.com/mpf/${MOYASAR_VERSION}/moyasar.js`;
const MOYASAR_CSS = `https://cdn.moyasar.com/mpf/${MOYASAR_VERSION}/moyasar.css`;

function loadMoyasar() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Moyasar) return Promise.resolve(window.Moyasar);
  if (window.__moyasarLoading) return window.__moyasarLoading;

  window.__moyasarLoading = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-moyasar]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = MOYASAR_CSS;
      link.dataset.moyasar = '1';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = MOYASAR_JS;
    script.async = true;
    script.onload = () => resolve(window.Moyasar);
    script.onerror = () => {
      window.__moyasarLoading = null;
      reject(new Error('Moyasar failed to load'));
    };
    document.head.appendChild(script);
  });
  return window.__moyasarLoading;
}

export default function CheckoutClient() {
  const { cartItems, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    phone:    '',
    address:  '',
    city:     '',
    state:    '',
    postcode: '',
    country:  'SA',
  });

  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loading, setLoading]               = useState(false);
  const [paymentMethod, setPaymentMethod]   = useState('card'); // 'card' | 'cod' — البطاقة افتراضياً

  // الدفع بالبطاقة: بعد ما ينعمل الطلب
  const [pendingPayment, setPendingPayment] = useState(null); // { orderId, orderNumber, total, amount, currency, description }
  const [formLoading, setFormLoading]       = useState(false);

  // كوبون
  const [couponCode, setCouponCode]       = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError]     = useState('');

  // جلب العنوان المحفوظ
  useEffect(() => {
    const fetchSavedAddress = async () => {
      try {
        const res = await fetch('/api/account/get-address');
        if (!res.ok) return;
        const data = await res.json();
        if (data.billing) {
          setForm((prev) => ({
            ...prev,
            phone:    data.billing.phone     || '',
            address:  data.billing.address_1 || '',
            city:     data.billing.city      || '',
            state:    data.billing.state     || '',
            postcode: data.billing.postcode  || '',
            country:  data.billing.country   || 'SA',
          }));
        }
      } catch {
        // نخلي الفورم فاضي
      } finally {
        setLoadingAddress(false);
      }
    };
    fetchSavedAddress();
  }, []);

  // تحميل مكتبة ميسر مسبقاً لما يختار البطاقة
  useEffect(() => {
    if (paymentMethod === 'card') loadMoyasar().catch(() => {});
  }, [paymentMethod]);

  // تشغيل نموذج ميسر بعد إنشاء الطلب
  useEffect(() => {
    if (!pendingPayment) return;

    const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY;
    if (!publishableKey) {
      toast.error('الدفع بالبطاقة غير مهيأ حالياً');
      return;
    }

    let cancelled = false;
    setFormLoading(true);

    loadMoyasar()
      .then((Moyasar) => {
        if (cancelled) return;
        const container = document.querySelector('.mysr-form');
        if (container) container.innerHTML = '';

        Moyasar.init({
          element: '.mysr-form',
          amount: pendingPayment.amount, // بالهللة — محسوب من السيرفر
          currency: pendingPayment.currency,
          description: pendingPayment.description,
          publishable_api_key: publishableKey,
          callback_url: `${window.location.origin}/api/payments/moyasar/callback?order_id=${pendingPayment.orderId}`,
          methods: ['creditcard'],
          supported_networks: ['mada', 'visa', 'mastercard'],
          language: 'ar',
          metadata: { order_id: String(pendingPayment.orderId) },
        });
      })
      .catch(() => {
        if (!cancelled) toast.error('تعذّر تحميل نموذج الدفع، حدّث الصفحة وحاول مرة ثانية');
      })
      .finally(() => {
        if (!cancelled) setFormLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingPayment]);

  const SHIPPING_COST = 23;
  const COD_FEE = 10; // نفس قيمة السيرفر — للعرض فقط
  const FREE_SHIPPING_THRESHOLD = 300;

  // ⚠️ هذي الأرقام للعرض فقط — المبلغ الفعلي يحسبه السيرفر
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  const calcDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percent')
      return (subtotal * appliedCoupon.amount) / 100;
    if (appliedCoupon.discount_type === 'fixed_cart')
      return Math.min(appliedCoupon.amount, subtotal);
    return 0;
  };

  const discount   = calcDiscount();
  const codFee     = paymentMethod === 'cod' ? COD_FEE : 0;
  const totalPrice = Math.max(0, subtotal - discount) + shipping + codFee;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { setCouponError('أدخل كود الكوبون'); return; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const res  = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || 'الكوبون غير صالح'); return; }
      if (data.minimum_amount && subtotal < data.minimum_amount) {
        setCouponError(`الحد الأدنى للطلب ${data.minimum_amount} ر.س`);
        return;
      }
      setAppliedCoupon(data);
      toast.success(`✅ تم تطبيق كوبون ${data.code}`);
    } catch {
      setCouponError('خطأ في الاتصال');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.success('تم إزالة الكوبون');
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) { toast.error('أدخل رقم الجوال'); return; }
    if (!form.postcode.trim()) { toast.error('أدخل الرقم الوطني'); return; }

    setLoading(true);
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cartItems,
          coupon_code:    appliedCoupon?.code || null,
          payment_method: paymentMethod,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error || 'فشل في إنشاء الطلب');
        return;
      }

      // ─── الدفع بالبطاقة: نعرض نموذج ميسر، والسلة تنمسح بعد نجاح الدفع ───
      if (paymentMethod === 'card') {
        setPendingPayment({
          orderId:     data.order.id,
          orderNumber: data.order.number,
          total:       data.order.total,
          amount:      data.payment.amount,
          currency:    data.payment.currency,
          description: data.payment.description,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // ─── الدفع عند الاستلام → نفس صفحة النتيجة حقت البطاقة ───
      // السلة تنفضى في صفحة النتيجة (عشان ما تومض "سلتك فارغة" قبل الانتقال)
      router.push(`/checkout/result?status=cod&order=${data.order.id}&total=${data.order.total}`);
    } catch (error) {
      toast.error('❌ خطأ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCardPayment = () => {
    setPendingPayment(null);
  };

  if (cartItems.length === 0) {
    return (
      <div dir="rtl" className={styles.checkoutPage} style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ marginBottom: '20px' }}>سلتك فارغة حالياً</h2>
        <button onClick={() => router.push('/')} className={styles.checkoutButton} style={{ maxWidth: '200px' }}>
          العودة للتسوق
        </button>
      </div>
    );
  }

  if (loadingAddress) {
    const pulse = {
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'checkoutPulse 1.5s ease-in-out infinite',
      borderRadius: '10px',
    };
    return (
      <>
        <style>{`@keyframes checkoutPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div dir="rtl" className={styles.checkoutPage}>
          <div style={{ ...pulse, height: '36px', width: '200px', marginBottom: '2rem' }} />
          <div className={styles.checkoutContent}>
            <div className={styles.checkoutFormSection}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ marginBottom: '1.2rem' }}>
                  <div style={{ ...pulse, height: '14px', width: '30%', marginBottom: '8px' }} />
                  <div style={{ ...pulse, height: '46px' }} />
                </div>
              ))}
              <div style={{ ...pulse, height: '54px', marginTop: '1rem' }} />
            </div>
            <div className={styles.checkoutCart}>
              {[1,2,3].map(i => (
                <div key={i} style={{ ...pulse, height: '60px', marginBottom: '12px' }} />
              ))}
              <div style={{ ...pulse, height: '120px', marginTop: '1rem' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  const serverTotalDiffers =
    pendingPayment && Math.abs(parseFloat(pendingPayment.total) - totalPrice) > 0.01;

  return (
    <div dir="rtl" className={styles.checkoutPage}>
      <h1 className={styles.checkoutHeading}>إتمام الشراء</h1>

      <div className={styles.checkoutContent}>

        {pendingPayment ? (
          /* ── نموذج الدفع بالبطاقة ── */
          <div className={styles.checkoutFormSection}>
            <h2 className={styles.sectionTitle}>💳 الدفع بالبطاقة</h2>

            <div style={{
              background: '#f0f4ff', border: '1px solid #c3d4f7', borderRadius: '12px',
              padding: '14px 16px', marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 700, color: '#1B365D' }}>
                طلب رقم #{pendingPayment.orderNumber}
              </div>
              <div style={{ marginTop: '4px', color: '#2d3748' }}>
                المبلغ المطلوب: <strong>{pendingPayment.total} ر.س</strong>
              </div>
              {serverTotalDiffers && (
                <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#b7791f' }}>
                  ⚠️ تم تحديث المبلغ حسب الأسعار والعروض الحالية
                </div>
              )}
            </div>

            {formLoading && (
              <p style={{ textAlign: 'center', color: '#64748b' }}>⏳ جارٍ تحميل نموذج الدفع...</p>
            )}

            <div className="mysr-form" dir="ltr" />

            <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
              🔒 بيانات بطاقتك تُرسل مباشرة إلى ميسر ولا نحتفظ بها
            </p>

            <button
              type="button"
              onClick={handleCancelCardPayment}
              style={{
                display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
                color: '#64748b', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              الرجوع وتغيير طريقة الدفع
            </button>
          </div>
        ) : (
          /* ── فورم الشحن ── */
          <div className={styles.checkoutFormSection}>
            <h2 className={styles.sectionTitle}>📦 عنوان الشحن</h2>
            <form onSubmit={handleOrder}>
              <div className={styles.checkoutFormGrid}>

                <div className={styles.inputGroup}>
                  <label htmlFor="phone">رقم الجوال *</label>
                  <input id="phone" name="phone" value={form.phone}
                    placeholder="05xxxxxxxx" onChange={handleChange}
                    className={styles.checkoutInput} required />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="address">العنوان *</label>
                  <input id="address" name="address" value={form.address}
                    placeholder="اسم الشارع، رقم المنزل" onChange={handleChange}
                    className={styles.checkoutInput} required />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="city">المدينة *</label>
                  <input id="city" name="city" value={form.city}
                    placeholder="الرياض، جدة..." onChange={handleChange}
                    className={styles.checkoutInput} required />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="state">المنطقة</label>
                  <input id="state" name="state" value={form.state}
                    placeholder="المنطقة" onChange={handleChange}
                    className={styles.checkoutInput} />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="postcode">الرقم الوطني *</label>
                  <input id="postcode" name="postcode" value={form.postcode}
                    placeholder="الرقم الوطني المختصر 4 حرف - 4 أرقام" onChange={handleChange}
                    className={styles.checkoutInput} required />
                </div>

                <div className={styles.inputGroup}>
                  <label>الدولة</label>
                  <input value="المملكة العربية السعودية" readOnly
                    className={styles.checkoutInput} style={{ background: '#f1f5f9' }} />
                </div>

              </div>

              {/* ── طريقة الدفع ── */}
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#2d3748' }}>
                  💳 طريقة الدفع
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                  {/* الدفع بالبطاقة */}
                  <label
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      border: `2px solid ${paymentMethod === 'card' ? '#1B365D' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      background: paymentMethod === 'card' ? '#f0f4ff' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      style={{ accentColor: '#1B365D', width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '24px' }}>💳</span>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                        الدفع بالبطاقة
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        مدى / فيزا / ماستركارد
                      </div>
                    </div>
                  </label>

                  {/* الدفع عند الاستلام */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      border: `2px solid ${paymentMethod === 'cod' ? '#1B365D' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      background: paymentMethod === 'cod' ? '#f0f4ff' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      style={{ accentColor: '#1B365D', width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '24px' }}>💵</span>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                        الدفع عند الاستلام
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        ادفع نقداً عند وصول طلبك — رسوم إضافية {COD_FEE} ر.س
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              {/* كوبون الخصم */}
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px', color: '#2d3748' }}>
                  🎟️ كوبون الخصم
                </h3>

                {appliedCoupon ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#f0fff4', border: '1px solid #c6f6d5',
                    borderRadius: '12px', padding: '12px 16px',
                  }}>
                    <span style={{ color: '#276749', fontWeight: '700' }}>
                      ✅ {appliedCoupon.code} —{' '}
                      {appliedCoupon.discount_type === 'percent'
                        ? `خصم ${appliedCoupon.amount}%`
                        : `خصم ${appliedCoupon.amount} ر.س`}
                    </span>
                    <button type="button" onClick={handleRemoveCoupon}
                      style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: '700' }}>
                      إزالة
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                      placeholder="أدخل كود الكوبون"
                      className={styles.checkoutInput}
                      style={{ flex: 1 }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    />
                    <button type="button" onClick={handleApplyCoupon} disabled={couponLoading}
                      style={{
                        background: '#00c2cb', color: '#fff', border: 'none',
                        borderRadius: '12px', padding: '0 20px', fontWeight: '700',
                        cursor: couponLoading ? 'not-allowed' : 'pointer',
                        opacity: couponLoading ? 0.7 : 1, whiteSpace: 'nowrap',
                      }}>
                      {couponLoading ? '...' : 'تطبيق'}
                    </button>
                  </div>
                )}

                {couponError && (
                  <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '6px' }}>⚠️ {couponError}</p>
                )}
              </div>

              <button type="submit" disabled={loading} className={styles.checkoutButton}>
                {loading
                  ? '⏳ جارٍ الإرسال...'
                  : paymentMethod === 'card'
                    ? `المتابعة للدفع — ${totalPrice.toFixed(2)} ر.س`
                    : `تأكيد الطلب — ${totalPrice.toFixed(2)} ر.س`}
              </button>
            </form>
          </div>
        )}

        {/* ملخص الطلب */}
        <div className={styles.checkoutCart}>
          <h2 className={styles.sectionTitle}>🛒 ملخص الطلب ({cartItems.length})</h2>

          <div className={styles.cartItemsList}>
            {cartItems.map((item, index) => {
              const attributes   = item.selectedAttributes || {};
              const customFields = item.customFields || {};
              const hasAttributes   = Object.keys(attributes).length > 0;
              const hasCustomFields = Object.keys(customFields).length > 0;
              return (
                <div key={`${item.id}-${index}`} className={styles.checkoutCartItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQty}>الكمية: {item.quantity}</span>
                    {hasAttributes && (
                      <div className={styles.itemMeta}>
                        {Object.entries(attributes).map(([key, value]) => (
                          <span key={key} className={styles.itemMetaTag}>{key}: {value}</span>
                        ))}
                      </div>
                    )}
                    {hasCustomFields && (
                      <div className={styles.itemMeta}>
                        {Object.entries(customFields).map(([key, field]) => {
                          const label = field?.label || key;
                          const value = field?.value ?? field;
                          return value ? (
                            <span key={key} className={styles.itemMetaTag}>{label}: {value}</span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <span className={styles.itemPrice}>
                    {(item.price * item.quantity).toFixed(2)} {item.currency}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.orderSummary}>
            <div className={styles.summaryRow}>
              <span>المجموع الفرعي:</span>
              <span>{subtotal.toFixed(2)} ر.س</span>
            </div>
            {appliedCoupon && (
              <div className={styles.summaryRow} style={{ color: '#276749' }}>
                <span>الخصم ({appliedCoupon.code}):</span>
                <span>- {discount.toFixed(2)} ر.س</span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>الشحن:</span>
              <span>{shipping === 0 ? 'مجاني 🎉' : `${shipping.toFixed(2)} ر.س`}</span>
            </div>
            {codFee > 0 && !pendingPayment && (
              <div className={styles.summaryRow}>
                <span>رسوم الدفع عند الاستلام:</span>
                <span>{codFee.toFixed(2)} ر.س</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span>الإجمالي الكلي:</span>
              <span>{pendingPayment ? pendingPayment.total : totalPrice.toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
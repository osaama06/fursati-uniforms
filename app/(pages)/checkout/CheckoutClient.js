'use client';
import { useCart } from '../../context/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from '@/styles/pages/checkOut.module.css';

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

  // كوبون
  const [couponCode, setCouponCode]     = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount_type, amount, minimum_amount }
  const [couponError, setCouponError]   = useState('');

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
            phone:    data.billing.phone    || '',
            address:  data.billing.address_1 || '',
            city:     data.billing.city     || '',
            state:    data.billing.state    || '',
            postcode: data.billing.postcode  || '',
            country:  data.billing.country  || 'SA',
          }));
        }
      } catch {
        // لو فشل نخلي الفورم فاضي
      } finally {
        setLoadingAddress(false);
      }
    };
    fetchSavedAddress();
  }, []);

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // حساب الخصم
  const calcDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percent') {
      return (subtotal * appliedCoupon.amount) / 100;
    }
    if (appliedCoupon.discount_type === 'fixed_cart') {
      return Math.min(appliedCoupon.amount, subtotal);
    }
    return 0;
  };

  const discount   = calcDiscount();
  const totalPrice = Math.max(0, subtotal - discount);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // تطبيق الكوبون
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

      if (!res.ok) {
        setCouponError(data.error || 'الكوبون غير صالح');
        return;
      }

      // التحقق من الحد الأدنى
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
    setLoading(true);

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cartItems,
          coupon_code: appliedCoupon?.code || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        clearCart();
        toast.success('✅ تم إرسال طلبك بنجاح!');
        router.push('/orders?new=true');
      } else {
        toast.error(data?.error || 'فشل في إنشاء الطلب');
      }
    } catch (error) {
      toast.error('❌ خطأ: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  // Skeleton
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

  return (
    <div dir="rtl" className={styles.checkoutPage}>
      <h1 className={styles.checkoutHeading}>إتمام الشراء</h1>

      <div className={styles.checkoutContent}>

        {/* فورم الشحن */}
        <div className={styles.checkoutFormSection}>
          <h2 className={styles.sectionTitle}>📦 عنوان الشحن</h2>
          <form onSubmit={handleOrder}>
            <div className={styles.checkoutFormGrid}>

              {/* رقم الجوال */}
              <div className={styles.inputGroup}>
                <label htmlFor="phone">رقم الجوال *</label>
                <input
                  id="phone" name="phone" value={form.phone}
                  placeholder="05xxxxxxxx"
                  onChange={handleChange}
                  className={styles.checkoutInput}
                  required
                />
              </div>

              {/* العنوان */}
              <div className={styles.inputGroup}>
                <label htmlFor="address">العنوان *</label>
                <input
                  id="address" name="address" value={form.address}
                  placeholder="اسم الشارع، رقم المنزل"
                  onChange={handleChange}
                  className={styles.checkoutInput}
                  required
                />
              </div>

              {/* المدينة */}
              <div className={styles.inputGroup}>
                <label htmlFor="city">المدينة *</label>
                <input
                  id="city" name="city" value={form.city}
                  placeholder="الرياض، جدة..."
                  onChange={handleChange}
                  className={styles.checkoutInput}
                  required
                />
              </div>

              {/* المنطقة */}
              <div className={styles.inputGroup}>
                <label htmlFor="state">المنطقة</label>
                <input
                  id="state" name="state" value={form.state}
                  placeholder="المنطقة"
                  onChange={handleChange}
                  className={styles.checkoutInput}
                />
              </div>

              {/* الرقم الوطني*/}
              <div className={styles.inputGroup}>
                <label htmlFor="postcode"> الرقم الوطني</label>
                <input
                  id="postcode" name="postcode" value={form.postcode}
                  placeholder="12345"
                  onChange={handleChange}
                  className={styles.checkoutInput}
                />
              </div>

              {/* الدولة */}
              <div className={styles.inputGroup}>
                <label>الدولة</label>
                <input
                  value="المملكة العربية السعودية" readOnly
                  className={styles.checkoutInput}
                  style={{ background: '#f1f5f9' }}
                />
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
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    style={{
                      background: '#00c2cb', color: '#fff', border: 'none',
                      borderRadius: '12px', padding: '0 20px', fontWeight: '700',
                      cursor: couponLoading ? 'not-allowed' : 'pointer',
                      opacity: couponLoading ? 0.7 : 1, whiteSpace: 'nowrap',
                    }}
                  >
                    {couponLoading ? '...' : 'تطبيق'}
                  </button>
                </div>
              )}

              {couponError && (
                <p style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '6px' }}>⚠️ {couponError}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className={styles.checkoutButton}>
              {loading ? '⏳ جارٍ الإرسال...' : `تأكيد الطلب — ${totalPrice.toFixed(2)} ر.س`}
            </button>
          </form>
        </div>

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
              <span style={{ color: '#0ca678', fontWeight: 'bold' }}>مجاني</span>
            </div>

            <div className={styles.totalRow}>
              <span>الإجمالي الكلي:</span>
              <span>{totalPrice.toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
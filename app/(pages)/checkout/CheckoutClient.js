'use client';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/checkOut.module.css';

export default function CheckoutClient() {
  const { cartItems, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'SA',
  });

  const [loading, setLoading] = useState(false);

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cartItems }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        clearCart();
        router.push('/orders?new=true');
      } else {
        alert(data?.error || 'فشل في إنشاء الطلب');
      }
    } catch (error) {
      setLoading(false);
      alert('❌ خطأ: ' + error.message);
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

  return (
    <div dir="rtl" className={styles.checkoutPage}>
      <h1 className={styles.checkoutHeading}>إتمام الشراء</h1>

      <div className={styles.checkoutContent}>

        {/* النصف الأول: معلومات الشحن */}
        <div className={styles.checkoutFormSection}>
          <h2 className={styles.sectionTitle}>📦 عنوان الشحن</h2>
          <form onSubmit={handleOrder}>
            <div className={styles.checkoutFormGrid}>
              <div className={styles.inputGroup}>
                <label htmlFor="address">العنوان</label>
                <input
                  id="address"
                  name="address"
                  value={form.address}
                  placeholder="اسم الشارع، رقم المنزل"
                  onChange={handleChange}
                  className={styles.checkoutInput}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="city">المدينة</label>
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  placeholder="الرياض، جدة..."
                  onChange={handleChange}
                  className={styles.checkoutInput}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="state">المنطقة</label>
                <input
                  id="state"
                  name="state"
                  value={form.state}
                  placeholder="المنطقة"
                  onChange={handleChange}
                  className={styles.checkoutInput}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="postcode">الرمز البريدي</label>
                <input
                  id="postcode"
                  name="postcode"
                  value={form.postcode}
                  placeholder="12345"
                  onChange={handleChange}
                  className={styles.checkoutInput}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="country">الدولة</label>
                <input
                  id="country"
                  name="country"
                  value="المملكة العربية السعودية"
                  readOnly
                  className={styles.checkoutInput}
                  style={{ background: '#f1f5f9' }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.checkoutButton}>
              {loading
                ? '⏳ جارٍ الإرسال...'
                : `تأكيد الطلب بقيمة ${totalPrice.toFixed(2)} ${cartItems[0]?.currency}`}
            </button>
          </form>
        </div>

        {/* النصف الثاني: ملخص الطلب */}
        <div className={styles.checkoutCart}>
          <h2 className={styles.sectionTitle}>🛒 ملخص الطلب ({cartItems.length})</h2>

          <div className={styles.cartItemsList}>
            {cartItems.map((item, index) => {
              const attributes = item.selectedAttributes || {};
              const customFields = item.customFields || {};
              const hasAttributes = Object.keys(attributes).length > 0;
              const hasCustomFields = Object.keys(customFields).length > 0;

              return (
                <div key={`${item.id}-${index}`} className={styles.checkoutCartItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQty}>الكمية: {item.quantity}</span>

                    {/* عرض الـ attributes المختارة (مثال: المقاس، الطول) */}
                    {hasAttributes && (
                      <div className={styles.itemMeta}>
                        {Object.entries(attributes).map(([key, value]) => (
                          <span key={key} className={styles.itemMetaTag}>
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* عرض الـ custom fields بالـ label الواضح */}
                    {hasCustomFields && (
                      <div className={styles.itemMeta}>
                        {Object.entries(customFields).map(([key, field]) => {
                          const label = field?.label || key;
                          const value = field?.value ?? field;
                          return value ? (
                            <span key={key} className={styles.itemMetaTag}>
                              {label}: {value}
                            </span>
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
              <span>{totalPrice.toFixed(2)} {cartItems[0]?.currency}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>الشحن:</span>
              <span style={{ color: '#0ca678', fontWeight: 'bold' }}>مجاني</span>
            </div>
            <div className={styles.totalRow}>
              <span>الإجمالي الكلي:</span>
              <span>{totalPrice.toFixed(2)} {cartItems[0]?.currency}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
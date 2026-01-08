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

  const handleOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
          <div className={styles.checkoutFormGrid}>
            <div className={styles.inputGroup}>
              <label>العنوان</label>
              <input name="address" placeholder="اسم الشارع، رقم المنزل" onChange={handleChange} className={styles.checkoutInput} required />
            </div>
            <div className={styles.inputGroup}>
              <label>المدينة</label>
              <input name="city" placeholder="الرياض، جدة..." onChange={handleChange} className={styles.checkoutInput} required />
            </div>
            <div className={styles.inputGroup}>
              <label>المنطقة</label>
              <input name="state" placeholder="المنطقة" onChange={handleChange} className={styles.checkoutInput} />
            </div>
            <div className={styles.inputGroup}>
              <label>الرمز البريدي</label>
              <input name="postcode" placeholder="12345" onChange={handleChange} className={styles.checkoutInput} />
            </div>
            <div className={styles.inputGroup}>
              <label>الدولة</label>
              <input name="country" value="المملكة العربية السعودية" readOnly className={styles.checkoutInput} style={{ background: '#f1f5f9' }} />
            </div>
          </div>
          
          <button onClick={handleOrder} disabled={loading} className={styles.checkoutButton}>
            {loading ? '⏳ جارٍ الإرسال...' : `تأكيد الطلب بقيمة ${totalPrice.toFixed(2)} ${cartItems[0]?.currency}`}
          </button>
        </div>

        {/* النصف الثاني: ملخص الطلب */}
        <div className={styles.checkoutCart}>
          <h2 className={styles.sectionTitle}>🛒 ملخص الطلب ({cartItems.length})</h2>
          <div className={styles.cartItemsList}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.checkoutCartItem}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQty}>الكمية: {item.quantity}</span>
                </div>
                <span className={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)} {item.currency}</span>
              </div>
            ))}
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

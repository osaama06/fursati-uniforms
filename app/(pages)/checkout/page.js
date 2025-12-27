'use client';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/checkOut.module.css';

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const router = useRouter();
  
  // نفس الـ State واللوجيك حقك بالضبط
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
      const token = localStorage.getItem('auth_token');

      console.log("🚀 البيانات المرسلة:", { ...form, cartItems });
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
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
      <div dir="rtl" className={styles.checkoutPage} style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>سلتك فارغة</h2>
        <button onClick={() => router.push('/')} className={styles.checkoutButton}>العودة للتسوق</button>
      </div>
    );
  }

  return (
    <div dir="rtl" className={styles.checkoutPage}>
      <h1 className={styles.checkoutHeading}>إتمام عملية الدفع</h1>
      
      <div className={styles.checkoutContent}>
        {/* قسم العنوان - نفس الـ Inputs حقتك */}
        <div className={styles.checkoutFormSection}>
          <h2 className={styles.sectionTitle}>📦 معلومات الشحن</h2>
          <div className={styles.checkoutFormGrid}>
            <div className={styles.inputGroup}>
              <label>العنوان بالتفصيل</label>
              <input name="address" placeholder="اسم الشارع، رقم المنزل..." onChange={handleChange} className={styles.checkoutInput} />
            </div>
            <div className={styles.inputGroup}>
              <label>المدينة</label>
              <input name="city" placeholder="مثال: الرياض" onChange={handleChange} className={styles.checkoutInput} />
            </div>
            <div className={styles.inputGroup}>
              <label>المنطقة</label>
              <input name="state" placeholder="مثال: المنطقة الشرقية" onChange={handleChange} className={styles.checkoutInput} />
            </div>
            <div className={styles.inputGroup}>
              <label>الرمز البريدي</label>
              <input name="postcode" placeholder="12345" onChange={handleChange} className={styles.checkoutInput} />
            </div>
            <div className={styles.inputGroup}>
              <label>الدولة</label>
              <input name="country" value="المملكة العربية السعودية" readOnly className={styles.checkoutInput} style={{ background: '#f8fafc' }} />
            </div>
          </div>
          
          <button onClick={handleOrder} disabled={loading} className={styles.checkoutButton}>
            {loading ? '⏳ جارٍ معالجة طلبك...' : `تأكيد الطلب (${totalPrice.toFixed(2)} ${cartItems[0]?.currency})`}
          </button>
        </div>

        {/* قسم ملخص السلة */}
        <div className={styles.checkoutCart}>
          <h2 className={styles.sectionTitle}>🛒 ملخص الطلب</h2>
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
              <span style={{ color: '#0ca678' }}>مجاني</span>
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
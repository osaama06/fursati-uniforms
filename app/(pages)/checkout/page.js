'use client';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/checkOut.module.css';

export default function CheckoutPage() {
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

  return (
    <div className={styles.checkoutPage}>
      <h1 className={styles.checkoutHeading}>الدفع</h1>
      {cartItems.length === 0 ? (
        <p className={styles.checkoutEmpty}>سلتك فارغة</p>
      ) : (
        <div className={styles.checkoutContent}>
          <div className={styles.checkoutCart}>
            <h2>🛒 محتويات السلة</h2>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.checkoutCartItem}>
                <span>{item.name}</span>
                <span>× {item.quantity}</span>
              </div>
            ))}
          </div>
          <div className={styles.checkoutFormSection}>
            <h2>📦 العنوان</h2>
            <div className={styles.checkoutFormGrid}>
              <input name="address" placeholder="العنوان" onChange={handleChange} className={styles.checkoutInput} />
              <input name="city" placeholder="المدينة" onChange={handleChange} className={styles.checkoutInput} />
              <input name="state" placeholder="المنطقة" onChange={handleChange} className={styles.checkoutInput} />
              <input name="postcode" placeholder="الرمز البريدي" onChange={handleChange} className={styles.checkoutInput} />
              <input name="country" value="SA" readOnly className={styles.checkoutInput} />
            </div>
            <button onClick={handleOrder} disabled={loading} className={styles.checkoutButton}>
              {loading ? '⏳ يتم الإرسال...' : '✅ إرسال الطلب'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

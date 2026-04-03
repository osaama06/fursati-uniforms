'use client';

import { useCart } from '../../context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import ReusableButton from '../../button/page';
import styles from '@/styles/pages/cart.module.css';

const Cart = () => {
  const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <div dir="rtl" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ fontSize: '4rem' }}>🛒</div>
        <h2>السلة فارغة حالياً</h2>
        <Link href="/" style={{ color: '#00c2cb' }}>ابدأ التسوق الآن</Link>
      </div>
    );
  }

  return (
    <main dir="rtl" className={styles.cartContainer}>
      <h1 className={styles.pageTitle}>🛒 سلة التسوق ({cartItems.length})</h1>

      <div className={styles.cartGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.map((item) => {
            const finalSlug = decodeURIComponent(
              item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : item.id)
            );
            const productLink  = `/products/${finalSlug}`;
            const productImage = item.images?.[0]?.src || item.image || '/placeholder.jpg';

            return (
              <div key={item.id} className={styles.orderCard}>
                <div className={styles.imageContainer}>
                  <Link href={productLink}>
                    <Image
                      src={productImage}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized={true}
                    />
                  </Link>
                </div>

                <div className={styles.productInfo}>
                  <div>
                    <div className={styles.infoTop}>
                      <span className={styles.category}>
                        {item.categories && item.categories.length > 0
                          ? item.categories.map((cat) => cat.name).join(', ')
                          : 'منتج'}
                      </span>
                      <button onClick={() => removeFromCart(item.id)} className={styles.removeBtn}>✕</button>
                    </div>

                    <Link href={productLink} className={styles.productLink}>
                      <h3 style={{ margin: '5px 0', fontSize: '1rem' }}>{item.name}</h3>
                    </Link>

                    <div className={styles.priceText}>{item.price} {item.currency || 'ر.س'}</div>
                  </div>

                  <div className={styles.quantityControls}>
                    <div className={styles.qtyBox}>
                      <button onClick={() => decreaseQuantity(item.id)} className={styles.qtyBtn}>-</button>
                      <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                      <button onClick={() => increaseQuantity(item.id)} className={styles.qtyBtn}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.summaryCard}>
          <h3>ملخص الطلب</h3>
          <div className={styles.summaryRow}>
            <span>المجموع الفرعي</span>
            <span>{totalPrice.toFixed(2)} {cartItems[0]?.currency || 'ر.س'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>الشحن</span>
            <span style={{ color: '#0ca678', fontWeight: 'bold' }}>مجاني</span>
          </div>
          <div className={styles.totalDivider}>
            <span style={{ fontWeight: 'bold' }}>الإجمالي الكلي</span>
            <span style={{ fontWeight: '900', fontSize: '1.5rem', color: '#00c2cb' }}>
              {totalPrice.toFixed(2)} {cartItems[0]?.currency || 'ر.س'}
            </span>
          </div>
          <ReusableButton goToCheckout style={{ width: '100%', backgroundColor: '#1b365d', color: '#fff' }}>
            تابع إلى الدفع
          </ReusableButton>
        </div>
      </div>
    </main>
  );
};

export default Cart;
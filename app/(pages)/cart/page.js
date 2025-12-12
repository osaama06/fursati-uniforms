'use client';

import { useCart } from '../../context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import ReusableButton from '../../button/page';
import styles from '@/styles/pages/cart.module.css';



const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className={styles.orders}>
      <h1 className={styles.pagetitle}>السلة</h1>
      <br />

      {cartItems.length === 0 ? (
        <p>السلة فارغة</p>
      ) : (
        cartItems.map((item) => (
          <div key={item.id} className={styles.ordercard}>
            <div className={styles.imgecontainer}>
              <Link href={`/products/${item.slug}`} className={styles.productLink}>
                <Image
                  src={item.images?.[0]?.src || '/placeholder.jpg'}
                  alt={item.name}
                  height={150}
                  width={100}
                />
              </Link>
            </div>

            <div className={styles.productinfo}>
              <span className={styles.categorey}>
                {item.categories?.map((cat) => cat.name).join(', ')}
              </span>

              <div onClick={() => removeFromCart(item.id)} className={styles.remvedProduct}>
                <button onClick={() => removeFromCart(item.id)} title="حذف المنتج">
                  X
                </button>
              </div>

              <Link href={`/products/${item.slug}`} className={styles.productLink}>
                <h2 className={styles.productTitle}>{item.name}</h2>
              </Link>

              <span>السعر: {item.price} {item.currency}</span>

              <div className={styles.bottom}>
                <div className={styles.qt}>
                  <button onClick={() => increaseQuantity(item.id)}>+</button>
                  <p>{item.quantity}</p>
                  <button onClick={() => decreaseQuantity(item.id)}>-</button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {cartItems.length > 0 && (
        <>
          <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
            المجموع الكلي: {totalPrice.toFixed(2)} {cartItems[0]?.currency}
          </div>

          <ReusableButton goToCheckout>
            تابع إلى الدفع
          </ReusableButton>
        </>
      )}
    </div>
  );
};

export default Cart;

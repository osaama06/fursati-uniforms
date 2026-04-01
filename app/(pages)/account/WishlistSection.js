'use client';
import { useWishlist } from '@/app/context/WishlistContext';
import Link from 'next/link';
import Image from 'next/image';

export default function WishlistSection() {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="content-card">
      <div className="content-header">
        <h2>❤️ المفضلة ({wishlistItems.length})</h2>
      </div>
      {wishlistItems.length === 0 ? (
        <p className="empty-msg">لا توجد منتجات في المفضلة.</p>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div key={item.id} className="wishlist-card">
              <Link href={`/products/${item.slug}`}>
                <Image src={item.image} alt={item.name} width={100} height={100} className="wishlist-img" />
              </Link>
              <div className="wishlist-info">
                <Link href={`/products/${item.slug}`} className="wishlist-name">{item.name}</Link>
                <span className="wishlist-price">{item.price} ر.س</span>
              </div>
              <button className="wishlist-remove" onClick={() => removeFromWishlist(item.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // تحميل السلة من localStorage عند بداية التطبيق
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  // حفظ السلة عند أي تغيير
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // إضافة منتج للسلة
  // المنتج يصل من ProductContent بهذا الشكل:
  // {
  //   id, productId, variationId, name, price, image, slug,
  //   selectedAttributes: { size: "XL", length: "34 انش" },
  //   customFields: { field_key: "value" }
  // }
  const addToCart = (product) => {
    const cartProduct = {
      id: product.id,
      productId: product.productId || product.id,
      variationId: product.variationId || null,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      currency: product.currency || 'ر.س',
      image: product.images?.[0]?.src || product.image || '/placeholder.jpg',
      slug: product.slug,
      permalink: product.permalink
        ? product.permalink.replace(process.env.NEXT_PUBLIC_WP_URL, '')
        : `/products/${product.slug}`,
      // نحفظ الـ attributes والـ custom fields كما هي
      selectedAttributes: product.selectedAttributes || {},
      customFields: product.customFields || {},
    };

    setCartItems((prev) => {
      // نبحث عن نفس المنتج بنفس الخيارات تماماً
      const existing = prev.find(
        (item) =>
          item.id === cartProduct.id &&
          JSON.stringify(item.selectedAttributes) === JSON.stringify(cartProduct.selectedAttributes) &&
          JSON.stringify(item.customFields) === JSON.stringify(cartProduct.customFields)
      );

      if (existing) {
        return prev.map((item) =>
          item.id === existing.id &&
          JSON.stringify(item.selectedAttributes) === JSON.stringify(existing.selectedAttributes) &&
          JSON.stringify(item.customFields) === JSON.stringify(existing.customFields)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, cartProduct];
    });
  };

  // إزالة منتج
  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter((item) => item.id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // زيادة الكمية
  const increaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // تقليل الكمية
  const decreaseQuantity = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  // تفريغ السلة
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
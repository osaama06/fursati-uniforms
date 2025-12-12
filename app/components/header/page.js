'use client';

import Link from "next/link";
import Image from 'next/image';
import { FiShoppingCart } from "react-icons/fi";
import { IoIosSearch } from "react-icons/io";
import { MdPerson } from "react-icons/md";
import { IoMenuSharp } from "react-icons/io5";
import { useCart } from "../../context/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/components/Header.css";

export default function Header() {
  const { cartItems } = useCart();
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const router = useRouter();

  // 🟡 تحسين منطق إخفاء الهيدر
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let timeoutId = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (delta < -20) {
        // المستخدم طالع → أظهر الهيدر على طول
        setShowHeader(true);
        if (timeoutId) clearTimeout(timeoutId);
      } else if (delta > 40) {
        // المستخدم نازل كثير → أخفي الهيدر بعد تأخير بسيط
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            setShowHeader(false);
            timeoutId = null;
          }, 150);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 🔒 منع التمرير عند فتح القائمة
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const [categories, setCategories] = useState([]);
  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/categories");
      const data = await res.json();
      const filtered = data.filter(cat => cat.count > 0);
      setCategories(filtered);
    }
    fetchCategories();
  }, []);

  return (
    <header className={`header ${!showHeader ? 'header--hidden' : ''}`}>
      <div className="wrapper">
        <div className="logo">
          <div className="menu" onClick={() => setMenuOpen(true)}>
            <IoMenuSharp />
          </div>
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="logo-img"
              priority
            />
          </Link>
        </div>

        <div className="account">
          <Link href="../signup">
            <div className="sub-text">تسجيل الدخول</div>
          </Link>
        </div>

        <div className="icons">
          <Link href="/orders" className="icon-block">
            <div className="sub-text">المرتجعات</div>
            <strong>والطلبات</strong>
          </Link>
          <Link href="/account" className="icon-btn">
            <MdPerson className="icon" />
          </Link>
          <Link href="/cart" className="icon-btn cart-icon">
            <FiShoppingCart className="icon" />
            {totalQuantity > 0 && (
              <span className="cart-count">{totalQuantity}</span>
            )}
          </Link>
        </div>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            className="search-input"
            placeholder="على ايش تدور؟"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-btn" type="submit" aria-label="بحث">
            <IoIosSearch className="search-icon" />
          </button>
        </form>
      </div>

      {menuOpen && (
        <div className="side-menu">
          <button className="close-btn" onClick={() => setMenuOpen(false)}>×</button>
          <div className="side-menu-content">
            <ul>
              {categories.map((cat) => (
                <li key={cat.id} onClick={() => setMenuOpen(false)}>
                  <Link href={`/${cat.slug}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}

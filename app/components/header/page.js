"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation"; 
import { HiOutlineSearch, HiOutlineUser, HiOutlineShoppingBag, HiMenu, HiX } from "react-icons/hi";
import "@/styles/components/Header.css";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isMenuOpen]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        const buildTree = (items, parentId) => {
          return items
            .filter(item => item.parent === parentId)
            .map(item => ({ ...item, children: buildTree(items, item.id) }));
        };
        setCategories(buildTree(data, 27));
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  const CategoryTree = ({ items, level = 0 }) => (
    <ul style={{ listStyle: 'none', padding: level === 0 ? 0 : '0 15px 0 0', margin: 0 }}>
      {items.map((item) => (
        <li key={item.id} style={{ marginBottom: '5px' }}>
          <Link href={`/${item.slug}`} onClick={() => setIsMenuOpen(false)} style={{ 
              display: 'block', padding: '10px 0', textDecoration: 'none', 
              color: level === 0 ? '#0d0628' : '#444',
              fontWeight: level === 0 ? '800' : '500',
              fontSize: level === 0 ? '17px' : '15px'
          }}>
            {item.name}
          </Link>
          {item.children && item.children.length > 0 && <CategoryTree items={item.children} level={level + 1} />}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <header className="main-header" dir="rtl">
        <div className="header-container">
          <div className="header-row">
            <div className="right-section">
              {/* حل مشكلة button do not have accessible name */}
              <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(true)} aria-label="فتح القائمة الجانبية">
                <HiMenu size={28} />
              </button>
              <Link href="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }} aria-label="الرئيسية">
                <Image src="/logo.png" alt="فرصتي" width={40} height={40} />
                <span className="logo">فرصتي</span>
              </Link>
            </div>

            <div className="search-section desktop-only">
              <form className="search-wrapper" onSubmit={(e) => {
                e.preventDefault();
                const q = e.target.search.value;
                if(q.trim()) router.push(`/search?q=${q}`);
              }}>
                <input type="text" name="search" placeholder="بحث..سكرب , لابكوت , مريول" className="search-input" aria-label="بحث عن منتجات" />
                <button type="submit" className="search-submit-btn" aria-label="تأكيد البحث"><HiOutlineSearch size={20} /></button>
              </form>
            </div>

            <div className="left-section">
              <button className="mobile-search-btn" onClick={() => setIsSearchOpen(!isSearchOpen)} aria-label="فتح البحث">
                {isSearchOpen ? <HiX size={24} /> : <HiOutlineSearch size={24} />}
              </button>
              <Link href="/account" className="icon-link" aria-label="حسابي"><HiOutlineUser size={24} /></Link>
              <Link href="/cart" className="icon-link cart-link" aria-label="سلة التسوق">
                <HiOutlineShoppingBag size={24} />
                <span className="cart-badge">0</span>
              </Link>
            </div>
          </div>

          <div className={`mobile-search-dropdown ${isSearchOpen ? "show" : ""}`}>
             <form className="search-wrapper" onSubmit={(e) => {
                e.preventDefault();
                const q = e.target.search.value;
                if(q.trim()) { router.push(`/search?q=${q}`); setIsSearchOpen(false); }
              }}>
                <input type="text" name="search" placeholder="..سكرب , لابكوت , مريول" className="search-input" aria-label="بحث في الجوال" />
                <button type="submit" className="search-submit-btn" aria-label="تأكيد البحث"><HiOutlineSearch size={20} /></button>
              </form>
          </div>
        </div>
      </header>

      <div className={`drawer-overlay ${isMenuOpen ? "active" : ""}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`side-drawer ${isMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>الأقسام</h3>
          <button className="close-drawer" onClick={() => setIsMenuOpen(false)} aria-label="إغلاق القائمة">
            <HiX size={26} />
          </button>
        </div>
        <div className="drawer-content" style={{ overflowY: 'auto', flexGrow: 1, padding: '20px' }}>
          <CategoryTree items={categories} />
        </div>
      </div>
    </>
  );
}
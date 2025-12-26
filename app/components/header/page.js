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

  // 1. منع التمرير للمحتوى الخلفي عند فتح المنيو
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isMenuOpen]);

  // 2. بناء الشجرة (بدءاً من ID: 27)
  const buildTree = (items, parentId) => {
    return items
      .filter(item => item.parent === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        const treeData = buildTree(data, 27); 
        setCategories(treeData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // 3. مكون عرض الشجرة (ثابت ومفرود)
  const CategoryTree = ({ items, level = 0 }) => {
    return (
      <ul style={{ 
        listStyle: 'none', 
        padding: level === 0 ? 0 : '0 15px 0 0', // إزاحة لليمين للأبناء
        margin: 0,
        borderRight: level === 0 ? 'none' : '1px solid rgba(242, 133, 109, 0.3)' 
      }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: '5px' }}>
            <Link 
              href={`/${item.slug}`} 
              onClick={() => setIsMenuOpen(false)}
              style={{ 
                display: 'block',
                padding: '10px 0',
                textDecoration: 'none', 
                color: level === 0 ? '#0d0628' : '#444',
                fontWeight: level === 0 ? '800' : '500',
                fontSize: level === 0 ? '17px' : '15px',
                borderBottom: level === 0 ? '1px solid #f0f0f0' : 'none'
              }}
            >
              {item.name}
            </Link>
            {item.children && item.children.length > 0 && (
              <CategoryTree items={item.children} level={level + 1} />
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <header className="main-header" dir="rtl">
        {/* ... نفس كود الهيدر اللي عندك بدون تغيير ... */}
        <div className="header-container">
          <div className="header-row">
            <div className="right-section">
              <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(true)}>
                <HiMenu size={28} />
              </button>
              <Link href="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <Image src="/logo.png" alt="فرصتي" width={40} height={40} />
                <span className="logo">فرصتي</span>
              </Link>
            </div>
            {/* باقي العناصر (Search, Account, Cart) كما هي */}
            <div className={`search-section ${isSearchOpen ? "show-mobile" : ""}`}>
              <form className="search-wrapper" onSubmit={(e) => {
                e.preventDefault();
                const q = e.target.search.value;
                if(q.trim()) { router.push(`/search?q=${q}`); setIsSearchOpen(false); }
              }}>
                <input type="text" name="search" placeholder="..سكرب , لابكوت , مريول" className="search-input" />
                <button type="submit" className="search-submit-btn"><HiOutlineSearch size={20} /></button>
              </form>
            </div>
            <div className="left-section">
              <button className="mobile-search-btn" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                {isSearchOpen ? <HiX size={24} /> : <HiOutlineSearch size={24} />}
              </button>
              <Link href="/account" className="icon-link"><HiOutlineUser size={24} /></Link>
              <Link href="/cart" className="icon-link cart-link"><HiOutlineShoppingBag size={24} /><span className="cart-badge">0</span></Link>
            </div>
          </div>
        </div>
      </header>

      {/* المنيو الجانبي المعدل */}
      <div className={`drawer-overlay ${isMenuOpen ? "active" : ""}`} onClick={() => setIsMenuOpen(false)}></div>
      
      <div className={`side-drawer ${isMenuOpen ? "open" : ""}`} style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100vh', // حد أقصى لطول المنيو هو طول الشاشة
      }}>
        <div className="drawer-header" style={{ flexShrink: 0 }}>
          <h3>الأقسام</h3>
          <button className="close-drawer" onClick={() => setIsMenuOpen(false)}><HiX size={24} /></button>
        </div>

        {/* هذا هو الجزء القابل للسكرول */}
        <div className="drawer-content" style={{ 
          overflowY: 'auto', // تفعيل السكرول العمودي
          flexGrow: 1, 
          padding: '10px 20px 40px 20px', // إضافة padding بالأسفل لراحة التصفح
          backgroundColor: '#fff'
        }}>
          <CategoryTree items={categories} />
        </div>
      </div>
    </>
  );
}
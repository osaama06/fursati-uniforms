"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image"; // تأكد من استيراد المكون
import { useRouter } from "next/navigation"; 
import { HiOutlineSearch, HiOutlineUser, HiOutlineShoppingBag, HiMenu, HiX } from "react-icons/hi";
import "@/styles/components/Header.css";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = e.target.search.value;
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      <header className="main-header" dir="rtl">
        <div className="header-container">
          <div className="header-row">
            
            {/* اليمين: أيقونة المنيو + صورة اللوجو + نص فرصتي */}
            <div className="right-section">
              <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(true)}>
                <HiMenu size={28} />
              </button>
              
              <Link href="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <Image 
                  src="/logo.png"
                  alt="فرصتي"
                  width={40}
                  height={40}
                />
                <span className="logo">فرصتي</span>
              </Link>
            </div>

            {/* باقي الكود كما هو بدون أي تغيير */}
            <div className={`search-section ${isSearchOpen ? "show-mobile" : ""}`}>
              <form className="search-wrapper" onSubmit={handleSearch}>
                <input 
                  type="text" 
                  name="search" 
                  placeholder="..سكرب , لابكوت , مريول" 
                  className="search-input" 
                />
                <button type="submit" className="search-submit-btn">
                  <HiOutlineSearch size={20} />
                </button>
              </form>
            </div>

            <div className="left-section">
              <button className="mobile-search-btn" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                {isSearchOpen ? <HiX size={24} /> : <HiOutlineSearch size={24} />}
              </button>

              <Link href="/account" className="icon-link">
                <HiOutlineUser size={24} />
              </Link>

              <Link href="/cart" className="icon-link cart-link">
                <HiOutlineShoppingBag size={24} />
                <span className="cart-badge">0</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* المنيو الجانبي وباقي الأجزاء بدون تغيير */}
      <div className={`drawer-overlay ${isMenuOpen ? "active" : ""}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`side-drawer ${isMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <span>القائمة</span>
          <button className="close-drawer" onClick={() => setIsMenuOpen(false)}><HiX size={24} /></button>
        </div>
        <div className="drawer-content">
           <Link href="/category/scrubs" onClick={() => setIsMenuOpen(false)}>سكراب طبي</Link>
           <Link href="/category/labcoats" onClick={() => setIsMenuOpen(false)}>لابكوت</Link>
           <Link href="/category/school" onClick={() => setIsMenuOpen(false)}>زي مدرسي</Link>
        </div>
      </div>
    </>
  );
}
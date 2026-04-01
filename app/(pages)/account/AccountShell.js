'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

const navItems = [
  { href: '/account',           label: '🏠 لوحة التحكم' },
  { href: '/orders',            label: '📦 طلباتي' },
  { href: '/account/address',   label: '📍 العناوين' },
  { href: '/account/edit',      label: '✏️ تعديل البيانات' },
  { href: '/account/password',  label: '🔒 تغيير كلمة المرور' },
];

export default function AccountShell({ title, children }) {
  const pathname = usePathname();
  const isSubPage = pathname !== '/account';

  return (
    <div dir="rtl" style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>

      {/* زر الرجوع — يظهر فقط في الصفحات الفرعية */}
      {isSubPage && (
        <Link
          href="/account"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '24px',
            color: '#555',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
            background: '#f5f5f5',
            padding: '8px 16px',
            borderRadius: '10px',
            transition: '0.2s',
          }}
        >
          <ArrowRight size={16} />
          العودة للحساب
        </Link>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px' }}>

        {/* Sidebar */}
        <aside style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid #f0f0f0',
          padding: '20px',
          height: 'fit-content',
          position: 'sticky',
          top: '20px',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: pathname === href ? '700' : '500',
                  fontSize: '0.95rem',
                  color: pathname === href ? '#00c2cb' : '#555',
                  background: pathname === href ? '#f0fbfc' : 'transparent',
                  transition: '0.2s',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main>
          {/* Page Header */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #f0f0f0',
            padding: '24px 28px',
            marginBottom: '20px',
          }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#1a1a1a' }}>
              {title}
            </h1>
          </div>

          {/* Content */}
          {children}
        </main>

      </div>
    </div>
  );
}
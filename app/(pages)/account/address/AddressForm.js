'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AddressForm({ customerId, billing }) {
  const [data, setData] = useState({
    first_name: billing?.first_name || '',
    last_name:  billing?.last_name  || '',
    phone:      billing?.phone      || '',
    address_1:  billing?.address_1  || '',
    city:       billing?.city       || '',
    country:    billing?.country    || 'SA',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/account/update-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, billing: data }),
      });
      const json = await res.json();
      if (res.ok) setSuccess(true);
      else setError(json.error || 'حدث خطأ');
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>

      {/* هيدر */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <Link href="/account" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: '10px',
          background: '#f5f5f5', color: '#555', textDecoration: 'none',
          transition: '0.2s',
        }}>
          <ArrowRight size={18} />
        </Link>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>📍 العناوين</h1>
      </div>

      {/* الفورم */}
      <form onSubmit={handleSubmit} style={{
        background: '#fff', padding: '28px',
        borderRadius: '20px', border: '1px solid #f0f0f0',
      }}>
        {/* صفان متجانبان */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          {[
            { label: 'الاسم الأول', key: 'first_name' },
            { label: 'اسم العائلة', key: 'last_name' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input value={data[key]} onChange={e => setData({ ...data, [key]: e.target.value })} style={inputStyle} />
            </div>
          ))}
        </div>

        {/* باقي الحقول */}
        {[
          { label: 'رقم الجوال', key: 'phone' },
          { label: 'العنوان',    key: 'address_1' },
          { label: 'المدينة',   key: 'city' },
        ].map(({ label, key }) => (
          <div key={key} style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>{label}</label>
            <input value={data[key]} onChange={e => setData({ ...data, [key]: e.target.value })} style={inputStyle} />
          </div>
        ))}

        {/* الدولة */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>الدولة</label>
          <select value={data.country} onChange={e => setData({ ...data, country: e.target.value })}
            style={{ ...inputStyle, background: '#fff' }}>
            <option value="SA">المملكة العربية السعودية</option>
            <option value="AE">الإمارات</option>
            <option value="KW">الكويت</option>
            <option value="QA">قطر</option>
            <option value="BH">البحرين</option>
            <option value="OM">عُمان</option>
          </select>
        </div>

        {success && <Alert type="success">✅ تم حفظ العنوان بنجاح</Alert>}
        {error   && <Alert type="error">⚠️ {error}</Alert>}

        <SubmitBtn loading={loading}>حفظ العنوان</SubmitBtn>
      </form>
    </main>
  );
}

/* ─── shared mini components ─── */
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1px solid #e0e0e0', fontSize: '0.95rem',
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontWeight: '600', fontSize: '0.88rem', color: '#444',
};

function Alert({ type, children }) {
  const isSuccess = type === 'success';
  return (
    <div style={{
      background: isSuccess ? '#f0fff4' : '#fff5f5',
      border: `1px solid ${isSuccess ? '#c6f6d5' : '#fed7d7'}`,
      borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
      color: isSuccess ? '#276749' : '#c53030', fontWeight: '600',
    }}>
      {children}
    </div>
  );
}

function SubmitBtn({ loading, children }) {
  return (
    <button type="submit" disabled={loading} style={{
      background: loading ? '#a0aec0' : '#00c2cb',
      color: '#fff', padding: '13px', borderRadius: '12px',
      border: 'none', fontWeight: '700', fontSize: '1rem',
      cursor: loading ? 'not-allowed' : 'pointer',
      width: '100%', transition: '0.2s',
    }}>
      {loading ? '⏳ جاري الحفظ...' : children}
    </button>
  );
}
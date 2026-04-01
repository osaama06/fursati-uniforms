'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function EditForm({ customerId, firstName, lastName }) {
  const [form, setForm]       = useState({ first_name: firstName || '', last_name: lastName || '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/account/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, ...form }),
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <Link href="/account" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: '10px',
          background: '#f5f5f5', color: '#555', textDecoration: 'none',
        }}>
          <ArrowRight size={18} />
        </Link>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>✏️ تعديل البيانات</h1>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: '#fff', padding: '28px',
        borderRadius: '20px', border: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'الاسم الأول', key: 'first_name' },
            { label: 'اسم العائلة', key: 'last_name' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {success && <Alert type="success">✅ تم تحديث البيانات بنجاح</Alert>}
        {error   && <Alert type="error">⚠️ {error}</Alert>}

        <SubmitBtn loading={loading}>حفظ التغييرات</SubmitBtn>
      </form>
    </main>
  );
}

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
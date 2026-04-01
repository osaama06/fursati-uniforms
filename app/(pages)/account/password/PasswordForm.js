'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PasswordForm({ customerId }) {
  const [form, setForm]         = useState({ password: '', confirm: '' });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const getStrength = () => {
    const p = form.password;
    if (!p)        return { label: '',        color: '#e0e0e0', width: '0%' };
    if (p.length < 6)  return { label: 'ضعيفة',   color: '#fc8181', width: '30%' };
    if (p.length < 10) return { label: 'متوسطة',  color: '#f6ad55', width: '60%' };
    return               { label: 'قوية',     color: '#68d391', width: '100%' };
  };

  const strength = getStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('كلمتا المرور غير متطابقتين'); return; }
    if (form.password.length < 8)       { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }

    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/account/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, password: form.password }),
      });
      const json = await res.json();
      if (res.ok) { setSuccess(true); setForm({ password: '', confirm: '' }); }
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
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>🔒 تغيير كلمة المرور</h1>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: '#fff', padding: '28px',
        borderRadius: '20px', border: '1px solid #f0f0f0',
      }}>

        {/* كلمة المرور */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>كلمة المرور الجديدة</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="8 أحرف على الأقل"
              style={{ ...inputStyle, paddingLeft: '44px' }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#888',
            }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          {form.password && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '4px', transition: '0.3s' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: strength.color, fontWeight: '600', marginTop: '4px', display: 'block' }}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* تأكيد */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>تأكيد كلمة المرور</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })}
            placeholder="أعد كتابة كلمة المرور"
            style={{
              ...inputStyle,
              borderColor: form.confirm && form.confirm !== form.password ? '#fc8181' : '#e0e0e0',
            }}
          />
          {form.confirm && form.confirm !== form.password && (
            <span style={{ fontSize: '0.78rem', color: '#e53e3e', marginTop: '4px', display: 'block' }}>
              كلمتا المرور غير متطابقتين
            </span>
          )}
        </div>

        {success && <Alert type="success">✅ تم تغيير كلمة المرور بنجاح</Alert>}
        {error   && <Alert type="error">⚠️ {error}</Alert>}

        <SubmitBtn loading={loading}>تغيير كلمة المرور</SubmitBtn>
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
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ حفظ التوكن في الكوكيز
      document.cookie = `token=${data.token}; path=/`;

      router.push('/account'); // إعادة التوجيه بعد تسجيل الدخول
    } else {
      setMessage('❌ فشل تسجيل الدخول: ' + (data.message || ''));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(to right, #fceabb, #f8b500)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <form onSubmit={handleLogin} style={{
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>🔐 تسجيل الدخول</h2>

        <input
          type="text"
          placeholder="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '1rem'
          }}
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '1rem'
          }}
        />

        <button type="submit" style={{
          backgroundColor: '#f8b500',
          color: '#fff',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease-in-out'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d49500'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8b500'}>
          دخول
        </button>

        {message && <p style={{ color: 'red', marginTop: '1rem' }}>{message}</p>}
      </form>
    </div>
  );
}
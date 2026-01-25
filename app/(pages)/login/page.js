'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import '@/styles/pages/login.css';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/account';
        router.push(redirect);
        router.refresh();
      } else {
        setMessage(data.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setMessage('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <Image src="/logo.png" alt="فرصتي" width={65} height={65} />
          <h2>تسجيل الدخول</h2>
          <p>مرحباً بك مجدداً في متجر فرصتي</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>اسم المستخدم أو البريد</label>
            <input
              type="text"
              placeholder="أدخل بريدك الإلكتروني"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>كلمة المرور</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <HiOutlineEyeOff size={22} /> : <HiOutlineEye size={22} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>

          {message && <div className="error-badge">{message}</div>}
        </form>

        <div className="login-footer">
          <p>ليس لديك حساب؟ <Link href="/signup">أنشئ حساباً جديداً</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <LoginForm />
    </Suspense>
  );
}
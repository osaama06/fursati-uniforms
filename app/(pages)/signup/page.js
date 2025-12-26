'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import '@/styles/pages/login.css';

export default function SignupPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage('❌ كلمة المرور غير متطابقة');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ تم إنشاء الحساب! جاري التحويل للدخول...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setMessage('❌ ' + data.message);
      }
    } catch (err) {
      setMessage('⚠️ خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        <div className="login-header">
          <Image src="/2logo.png" alt="فرصتي" width={65} height={65} />
          <h2>إنشاء حساب</h2>
          <p>انضم لأسرة فرصتي واستمتع بتجربة تسوق فريدة</p>
        </div>

        <form onSubmit={handleSignup} className="login-form">
          <div className="dual-input">
            <div className="input-group">
              <label>الاسم الأول</label>
              <input type="text" name="first_name" placeholder="أحمد" onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>الاسم الأخير</label>
              <input type="text" name="last_name" placeholder="العلي" onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <label>البريد الإلكتروني</label>
            <input type="email" name="email" placeholder="example@mail.com" onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>رقم الجوال</label>
            <input type="text" name="phone" placeholder="05xxxxxxxx" onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>كلمة المرور</label>
            <div className="password-wrapper">
              <input type={showPass ? "text" : "password"} name="password" onChange={handleChange} required />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <HiOutlineEyeOff size={22} /> : <HiOutlineEye size={22} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>تأكيد كلمة المرور</label>
            <div className="password-wrapper">
              <input type={showConfirmPass ? "text" : "password"} name="confirmPassword" onChange={handleChange} required />
              <button type="button" className="eye-btn" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                {showConfirmPass ? <HiOutlineEyeOff size={22} /> : <HiOutlineEye size={22} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'جاري المعالجة...' : 'تسجيل حساب جديد'}
          </button>

          {message && <div className={message.includes('✅') ? 'success-badge' : 'error-badge'}>{message}</div>}
        </form>
      </div>
    </div>
  );
}
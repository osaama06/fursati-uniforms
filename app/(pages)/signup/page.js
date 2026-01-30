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
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // مسح الخطأ عند الكتابة
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // التحقق من صحة الإيميل
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // التحقق من قوة كلمة المرور
  const validatePassword = (password) => {
    return password.length >= 8;
  };

  // التحقق من رقم الجوال السعودي
  const validatePhone = (phone) => {
    const phoneRegex = /^(05|5)[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = () => {
    const newErrors = {};

    // التحقق من الاسم الأول
    if (!form.first_name.trim()) {
      newErrors.first_name = 'الاسم الأول مطلوب';
    }

    // التحقق من الاسم الأخير
    if (!form.last_name.trim()) {
      newErrors.last_name = 'الاسم الأخير مطلوب';
    }

    // التحقق من الإيميل
    if (!form.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // التحقق من رقم الجوال
    if (!form.phone) {
      newErrors.phone = 'رقم الجوال مطلوب';
    } else if (!validatePhone(form.phone)) {
      newErrors.phone = 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
    }

    // التحقق من كلمة المرور
    if (!form.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (!validatePassword(form.password)) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 خانات على الأقل';
    }

    // التحقق من تطابق كلمة المرور
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // التحقق من صحة البيانات قبل الإرسال
    if (!validateForm()) {
      setMessage('❌ البيانات ناقصة');
      
      // التركيز على أول حقل فيه خطأ
      setTimeout(() => {
        const firstError = document.querySelector('.input-error');
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }

    setLoading(true);
    setMessage('');
    
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
          <Image src="/logo.png" alt="فرصتي" width={65} height={65} />
          <h2>إنشاء حساب</h2>
          <p>انضم لأسرة فرصتي واستمتع بتجربة تسوق فريدة</p>
        </div>

        <form onSubmit={handleSignup} className="login-form">
          <div className="dual-input">
            <div className="input-group">
              <label>الاسم الأول</label>
              <input 
                type="text" 
                name="first_name" 
                placeholder="أحمد" 
                value={form.first_name}
                onChange={handleChange} 
                className={errors.first_name ? 'input-error' : ''}
              />
              {errors.first_name && <span className="errortext">{errors.first_name}</span>}
            </div>
            <div className="input-group">
              <label>الاسم الأخير</label>
              <input 
                type="text" 
                name="last_name" 
                placeholder="محمد" 
                value={form.last_name}
                onChange={handleChange} 
                className={errors.last_name ? 'input-error' : ''}
              />
              {errors.last_name && <span className="error-text">{errors.last_name}</span>}
            </div>
          </div>

          <div className="input-group">
            <label>البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email" 
              placeholder="example@mail.com" 
              value={form.email}
              onChange={handleChange} 
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label>رقم الجوال</label>
            <input 
              type="tel" 
              name="phone" 
              placeholder="05xxxxxxxx" 
              value={form.phone}
              onChange={handleChange} 
              className={errors.phone ? 'input-error' : ''}
              maxLength="10"
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="input-group">
            <label>كلمة المرور</label>
            <div className="password-wrapper">
              <input 
                type={showPass ? "text" : "password"} 
                name="password" 
                value={form.password}
                onChange={handleChange} 
                className={errors.password ? 'input-error' : ''}
                placeholder="8 خانات على الأقل"
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <HiOutlineEyeOff size={22} /> : <HiOutlineEye size={22} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
            {!errors.password && form.password && form.password.length < 8 && (
              <span className="hint-text">متبقي {8 - form.password.length} خانات</span>
            )}
          </div>

          <div className="input-group">
            <label>تأكيد كلمة المرور</label>
            <div className="password-wrapper">
              <input 
                type={showConfirmPass ? "text" : "password"} 
                name="confirmPassword" 
                value={form.confirmPassword}
                onChange={handleChange} 
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              <button type="button" className="eye-btn" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                {showConfirmPass ? <HiOutlineEyeOff size={22} /> : <HiOutlineEye size={22} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'جاري المعالجة...' : 'تسجيل'}
          </button>

          {message && <div className={message.includes('✅') ? 'success-badge' : 'error-badge'}>{message}</div>}
        </form>
      </div>
    </div>
  );
}
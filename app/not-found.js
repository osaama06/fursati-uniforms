import Link from "next/link";
import "@/styles/pages/notfound.css";

const SHOP_URL = "/shop"; // غيّره لرابط صفحة المنتجات عندك
const WHATSAPP_URL = "https://wa.me/966533812602";

export default function NotFound() {
  return (
    <section className="nf-container" dir="rtl">
      <div className="nf-box">
        <svg
          className="nf-pulse"
          viewBox="0 0 320 80"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M0 40 H70 L82 40 L92 18 L104 62 L116 10 L128 70 L138 40 H320"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <p className="nf-code">404</p>
        <h1 className="nf-title">الصفحة هذي أخذت إجازة مرضية</h1>
        <p className="nf-text">
          دوّرنا عليها في كل الأقسام وما لقيناها. يمكن الرابط فيه غلط، أو الصفحة انشالت.
          بس السكراب حقنا موجود ومداوم.
        </p>

        <div className="nf-actions">
          <Link href={SHOP_URL} className="nf-btn nf-btn-primary">
            تسوّق السكراب
          </Link>
          <Link href="/" className="nf-btn nf-btn-secondary">
            الصفحة الرئيسية
          </Link>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="nf-help"
        >
          تدور على شي معيّن؟ كلّمنا واتساب
        </a>
      </div>
    </section>
  );
}
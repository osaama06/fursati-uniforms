import Link from "next/link";
import "@/styles/notfound.css";

export default function NotFound() {
  return (
    <div className="nf-container">
      <div className="nf-box">
        <h1 className="nf-title">404</h1>
        <h2 className="nf-sub">الصفحة غير موجودة</h2>
        <p className="nf-text">
          يبدو أنك وصلت لصفحة مفقودة… يا إن الرابط غلط، يا إنها طارت مع الريح.
        </p>

        <Link href="/" className="nf-btn">
          الرجوع للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}

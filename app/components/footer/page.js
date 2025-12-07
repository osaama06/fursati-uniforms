// import Link from "next/link";
import "@/styles/footer.css";
// app/components/Footer.js

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-col">
          <h3>عن المتجر</h3>
          <p>
            متجر فرصتي للزي الموحّد الطبي والمدرسي — نوفر لك جودة عالية، أسعار مناسبة،
            وتجربة تسوّق محترمة وسريعة.
          </p>
        </div>

        <div className="footer-col">
          <h3>روابط مهمة</h3>
          <ul>
            <li><Link href="/return-policy">سياسة الإرجاع والاستبدال</Link></li>
            <li><Link href="/about-us">من نحن</Link></li>
            <li><Link href="/contact">تواصل معنا</Link></li>
            <li><Link href="/shipping">الشحن </Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>تواصل معنا</h3>
          <ul>
            <li>📞 رقم التواصل: 05xxxxxxxx</li>
            <li>📩 البريد: info@furssati.io</li>
            <li><a href="https://wa.me/+966533812602">واتساب المتجر</a></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} متجر فرصتي – جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}

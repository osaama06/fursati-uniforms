import Link from "next/link";
import "@/styles/components/footer.css";


export default function Footer() {
  return (
    <footer className="modern-footer">
      <div className="footer-wave"></div> {/* خلفية موجية اختيارية بالـ CSS */}
      
      <div className="footer-main">
        <div className="footer-grid">
          
          {/* قسم البراند */}
          <div className="footer-brand">
            <h2 className="brand-name">فرصتي<span>.</span></h2>
            <p className="brand-tagline">
              الخيار الأول للزي الموحد (الطبي والمدرسي) في المملكة. جودة تليق بك.
            </p>
            <div className="social-pills">
              <a href="#" className="pill">Snapchat</a>
              <a href="#" className="pill">Instagram</a>
              <a href="https://wa.me/+966533812602" className="pill wa">WhatsApp</a>
            </div>
          </div>

          {/* الروابط السريعة */}
          <div className="footer-links-group">
            <div className="links-col">
              <h4>المتجر</h4>
              <Link href="/about-us">قصتنا</Link>
              <Link href="/blog">المدونة</Link>
              <Link href="/contact">تواصل معنا</Link>
            </div>
            <div className="links-col">
              <h4>المساعدة</h4>
              <Link href="/return-policy">الإرجاع والاستبدال</Link>
              <Link href="/shipping">معلومات الشحن</Link>
              <Link href="/faq">الأسئلة الشائعة</Link>
            </div>
          </div>

          {/* قسم التواصل السريع */}
          <div className="footer-newsletter">
            <h4>كن على تواصل</h4>
            <p>سجل معنا ليصلك جديد التشكيلات والخصومات.</p>
            <div className="contact-box">
               <span>📞 0533812602</span>
               <span>📩 info@furssati.io</span>
            </div>
          </div>

        </div>
      </div>

      <div className="footer-copyright">
        <div className="copyright-content">
          <p>© {new Date().getFullYear()} متجر فرصتي. صنع بكل ❤️ في المملكة.</p>
          <div className="payment-badges">
            <div className="badge">مدى</div>
            <div className="badge">Visa</div>
            <div className="badge">MasterCard</div>
            <div className="badge">Apple Pay</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
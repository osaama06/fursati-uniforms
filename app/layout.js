// app/layout.js
import { CartProvider } from "./context/CartContext";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono, Tajawal } from "next/font/google";
import Header from "./components/header/page";
import "./globals.css";
import Footer from "./components/footer/page";
import Navbar from "./components/navBar/page";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: 'swap', // ✅ تحسين الأداء
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

// ✅ Metadata الأساسية (سيتم override في الصفحات)
export const metadata = {
  metadataBase: new URL('https://fursatiuniforms.com'),

  title: {
    default: 'Fursati -متجر فرصتي للزي الموحد',
    template: '%s | Fursati', // لصفحات فرعية
  },

  description: 'متجر فرصتي المتخصص في بيع الزي المدرسي والطبي الموحد بجودة عالية وأسعار منافسة',

  // Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },



  // Theme Color
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#251f35' },
  ],

  // Viewport
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },

  // Additional Meta Tags
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Fursati',
    'application-name': 'Fursati',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* ✅ Preconnect للأداء */}
        <link rel="preconnect" href="https://fursatiuniforms.com" />
        <link rel="dns-prefetch" href="https://fursatiuniforms.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ✅ Additional SEO */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="SA" />
        <meta name="geo.placename" content="sakaka" />
      </head>

      <body className={tajawal.className}>
        {/* ✅ Google Analytics (إذا موجود) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* ✅ Facebook Pixel (اختياري) */}
        {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}

        <CartProvider>
          <Header />
          {/* <Navbar /> */}
          <main>{children}</main>
          <Footer />
          <Toaster position="top-center" />
        </CartProvider>
      </body>
    </html>
  );
}
// app/layout.js
import { CartProvider } from "./context/CartContext";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono, Tajawal } from "next/font/google";
import Header from "./components/header/page";
import Footer from "./components/footer/page";
import Script from "next/script";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
  preload: true,
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const SITE_URL = "https://fursatiuniforms.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "فرصتي | تسوق جميع منتجات الزي الموحد",
    template: "%s | فرصتي",
  },
  description:
    "متجر فرصتي للزي الموحد الطبي والمدرسي والعملي في السعودية. جودة عالية وتصاميم عملية بأسعار مناسبة.",

  keywords: [
    "فرصتي",
    "يونيفورم طبي",
    "زي طبي",
    "يونيفورم مدرسي",
    "Scrubs Saudi",
    "Medical Uniform Saudi",
    "متجر سعودي",
    "ملابس زي موحد",
    "مريول مدرسي",
    "ملابس عمل",
    "سديريي",
    "تطريز",
    "تفصيل ",
    "عبايات تخرج",
  ],

  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
      "x-default": "/",
    },
  },

  openGraph: {
    title: "فرصتي | تسوق جميع منتجات الزي الموحد",
    description:
      "متجر فرصتي لليونيفورم الطبي والمدرسي والعملي في السعودية.",
    url: SITE_URL,
    siteName: "فرصتي",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "فرصتي | تسوق جميع منتجات الزي الموحد",
    description:
      "أفضل متجر يونيفورم طبي ومدرسي في السعودية.",
    images: ["/og-image.webp"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },

  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#251f35" },
  ],

  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },

  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "فرصتي",
    "application-name": "فرصتي",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar-SA"
      dir="rtl"
      className={`${tajawal.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="content-language" content="ar-SA" />

        {/* Preconnects */}
        <link rel="preconnect" href="https://furssati.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://furssati.io" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={SITE_URL} />

        {/* تحسين اتصال Google Analytics */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        {/* Preload Banner Image (Fixed URL) */}
        <link
          rel="preload"
          as="image"
          href="https://www.fursatiuniforms.com/_next/image?url=https%3A%2F%2Ffurssati.io%2Fwp-content%2Fuploads%2F2025%2F06%2F%D9%81%D8%B1%D8%B5%D8%AA%D9%8A.webp&w=2048&q=75"
          fetchpriority="high"
          type="image/jpeg"
        />

        <meta name="google-site-verification" content="XiAUcrB6eUQFXmKOgwCJZ5OOKOzaZyRcNpoNyoHH4h4" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="SA" />
        <meta name="geo.placename" content="sakaka" />
      </head>

      <body className={tajawal.className}>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster position="top-center" />
        </CartProvider>

        {/* Google Analytics - يبدأ بعد أول تفاعل */}
        <Script id="ga-interaction-loader" strategy="afterInteractive">
{`
(function () {
  let loaded = false;

  function loadGA() {
    if (loaded) return;
    loaded = true;

    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-90YRR71JZ7';
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', 'G-90YRR71JZ7', { send_page_view: true });

    window.removeEventListener('scroll', loadGA);
    window.removeEventListener('click', loadGA);
    window.removeEventListener('touchstart', loadGA);
  }

  window.addEventListener('scroll', loadGA, { once: true });
  window.addEventListener('click', loadGA, { once: true });
  window.addEventListener('touchstart', loadGA, { once: true });
})();
`}
        </Script>

        {/* Facebook Pixel (كما هو بدون تغيير) */}
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
      </body>
    </html>
  );
}

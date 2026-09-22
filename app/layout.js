import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono, Tajawal } from "next/font/google";
import Header from "./components/header/page";
import Footer from "./components/footer/page";
import WhatsAppButton from "./components/WhatsAppButton";
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

const SITE_URL = "https://www.fursatiuniforms.com";

// =============================
// WooCommerce Auth
// =============================
const getAuthHeader = () => {
  return Buffer.from(
    `${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`
  ).toString("base64");
};

// =============================
// Build Categories Tree
// =============================
function buildCategoryTree(items, parentId) {
  return items
    .filter((item) => Number(item.parent) === Number(parentId))
    .map((item) => ({
      ...item,
      children: buildCategoryTree(items, item.id),
    }));
}

// =============================
// Fetch Header Categories
// =============================
async function getHeaderCategories() {
  try {
    const res = await fetch(
      "https://fursatiuniforms.store/wp-json/wc/v3/products/categories?per_page=100&hide_empty=false",
      {
        headers: {
          Authorization: `Basic ${getAuthHeader()}`,
        },

        // التصنيفات تتخزن لمدة ساعة
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) {
      console.error(
        "Failed to fetch header categories:",
        res.status
      );

      return [];
    }

    const data = await res.json();

    // نفس المنطق القديم عندك:
    // نبدأ من التصنيف الأب ID = 27
    return buildCategoryTree(data, 27);
  } catch (error) {
    console.error(
      "Error fetching header categories:",
      error
    );

    return [];
  }
}

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "فرصتي | تسوق جميع منتجات الزي الموحد",
    template: "%s | فرصتي",
  },

  description:
    "متجر فرصتي للزي الموحد الطبي والمدرسي والعملي في السعودية. جودة عالية وتصاميم عملية بأسعار مناسبة.",

  openGraph: {
    title: "فرصتي | تسوق جميع منتجات الزي الموحد",
    description:
      "متجر فرصتي للزي الموحد الطبي والمدرسي والعملي في السعودية.",
    siteName: "فرصتي",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "متجر فرصتي للزي الموحد",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "فرصتي | تسوق جميع منتجات الزي الموحد",
    description:
      "متجر فرصتي للزي الموحد الطبي والمدرسي والعملي في السعودية.",
    images: ["/og-image.webp"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },

  verification: {
    google: "XiAUcrB6eUQFXmKOgwCJZ5OOKOzaZyRcNpoNyoHH4h4",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#251f35",
    },
  ],
};

// =============================
// Root Layout
// =============================
export default async function RootLayout({
  children,
}) {
  // التصنيفات تنجلب على السيرفر
  // قبل إرسال الصفحة للمتصفح
  const categories =
    await getHeaderCategories();

  return (
    <html
      lang="ar-SA"
      dir="rtl"
      className={`${tajawal.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://fursatiuniforms.store"
          crossOrigin="anonymous"
        />

        <link
          rel="dns-prefetch"
          href="https://fursatiuniforms.store"
        />

        <link
          rel="preconnect"
          href="https://www.googletagmanager.com"
        />

        <meta
          name="format-detection"
          content="telephone=no"
        />
      </head>

      <body className={tajawal.className}>
        <CartProvider>
          <WishlistProvider>
            <Header
              categories={categories}
            />

            <main>{children}</main>

            <Footer />

            <WhatsAppButton />

            <Toaster position="top-center" />
          </WishlistProvider>
        </CartProvider>

        <Script
          id="ga-interaction-loader"
          strategy="afterInteractive"
        >
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

                function gtag() {
                  dataLayer.push(arguments);
                }

                window.gtag = gtag;

                gtag('js', new Date());

                gtag('config', 'G-90YRR71JZ7', {
                  send_page_view: true
                });

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

        {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
          >
            {`
              !function(f,b,e,v,n,t,s)
              {
                if(f.fbq)return;

                n=f.fbq=function(){
                  n.callMethod
                    ? n.callMethod.apply(n,arguments)
                    : n.queue.push(arguments)
                };

                if(!f._fbq)f._fbq=n;

                n.push=n;
                n.loaded=!0;
                n.version='2.0';
                n.queue=[];

                t=b.createElement(e);
                t.async=!0;
                t.src=v;

                s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s);

              }(
                window,
                document,
                'script',
                'https://connect.facebook.net/en_US/fbevents.js'
              );

              fbq(
                'init',
                '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}'
              );

              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
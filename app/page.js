// app/page.js
import BannerSlider from "./components/bannerslider/page";
import ProductSlider from "./components/ProductSlider/page";
import StoriesSlider from "./components/storiesSlider/page";
import { 
  generateOrganizationSchema, 
  generateWebsiteSchema,
  renderSchema 
} from '@/utils/schema';

// 🧠 دالة تجيب التصنيفات من WooCommerce
async function getCategories() {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");
  const res = await fetch("https://furssati.io/wp-json/wc/v3/products/categories", {
    headers: { Authorization: `Basic ${auth}` },
    next: { revalidate: 3600 } // Cache لمدة ساعة
  });
  const data = await res.json();
  return data.filter((cat) => cat.count > 0); // فقط التصنيفات اللي فيها منتجات
}

// 🧠 دالة تجيب المنتجات داخل تصنيف
async function getProductsByCategoryId(id) {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");
  const res = await fetch(`https://furssati.io/wp-json/wc/v3/products?category=${id}&per_page=10`, {
    headers: { Authorization: `Basic ${auth}` },
    next: { revalidate: 3600 }
  });
  return await res.json();
}

// ✅ Metadata للـ Homepage
export const metadata = {
  title: 'Fursati - متجر فرصتي للزي الموحد الطبي و المدرسي  | جودة عالية وأسعار حريقة',
  description: 'متجر فرصتي للزي الموحد طبي و مدرسي وغيره بجودة عالية وأسعار حريقة. نوفر سكراب طبي، مريول مدرسي، لابكوت، وجميع مستلزمات الزي الموحد في السعودية.',
  keywords: 'زي مدرسي، سكراب طبي، مريول، لابكوت،سديري,وزارة الصحة ,سدريي سحاب,بلوزة ,بالطو ، زي موحد، فرصتي، fursati، ملابس طبية، ملابس مدرسية، زي موحد السعودية,بالطو ',
  
  // Open Graph
  openGraph: {
    title: 'Fursati - متجر فرصتي للزي الموحد ',
    description: 'متجر فرصتي المتخصص في بيع الزي المدرسي والطبي بجودة عالية وأسعار منافسة. توصيل لجميع مدن المملكة.',
    url: 'https://fursatiuniforms',
    siteName: 'Fursatiuniforms',
    images: [
      {
        url: 'https://fursatiuniforms/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fursati - متجر للزي الموحد',
      }
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Fursati - متجر فرصتي للزي الموحد طبي مدرسي',
    description: 'Fursati - متجر فرصتي للزي الموحد طبي مدرسي',
    images: ['https://fursatiuniforms/og-image.jpg'],
    creator: '@fursati',
  },
  
  // Additional Meta Tags
  alternates: {
    canonical: 'https://fursatiuniforms',
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification (أضف أكواد التحقق هنا)
  verification: {
    // google: 'google-verification-code',
  },
};

export default async function Home() {
  const categories = await getCategories();
  const sliders = await Promise.all(
    categories.map(async (category) => {
      const products = await getProductsByCategoryId(category.id);
      return { category, products };
    })
  );
  
  // ✅ إعدادات الموقع للـ Schema
  const siteConfig = {
    name: "Fursati",
    alternateName: "فرصتي",
    url: "https://fursatiuniforms",
    logo: "https://fursatiuniforms/logo.png",
    image: "https://fursatiuniforms/og-image.jpg",
    description: "متجر فرصتي المتخصص في بيع الزي المدرسي والطبي الموحد بجودة عالية وأسعار منافسة. نوفر سكراب طبي، مريول مدرسي، لابكوت، وجميع مستلزمات الزي الموحد في السعودية مع التوصيل لجميع المدن.",
    phone: "+966533812602", 
    email: "info@furssati.io",
    address: {
      country: "SA"
    },
    socialLinks: [
      "https://twitter.com/fursati",
      "https://instagram.com/fursati",
      "https://facebook.com/fursati",
      "https://tiktok.com/@fursati"
    ]
  };
  
  // ✅ بناء الـ Schemas
  const organizationSchema = generateOrganizationSchema(siteConfig);
  const websiteSchema = generateWebsiteSchema(siteConfig);
  
  // ✅ Local Business Schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": siteConfig.name,
    "alternateName": siteConfig.alternateName,
    "image": siteConfig.image,
    "url": siteConfig.url,
    "telephone": siteConfig.phone,
    "email": siteConfig.email,
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": siteConfig.address.street,
      "addressLocality": siteConfig.address.city,
      "addressRegion": siteConfig.address.region,
      "postalCode": siteConfig.address.postalCode,
      "addressCountry": siteConfig.address.country
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "26.4207",
      "longitude": "50.0888"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday"
        ],
        "opens": "09:00",
        "closes": "22:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Friday", "Saturday"],
        "opens": "16:00",
        "closes": "22:00"
      }
    ],
    "paymentAccepted": "Cash, Credit Card, Apple Pay, Mada",
    "currenciesAccepted": "SAR",
    "description": siteConfig.description,
    "sameAs": siteConfig.socialLinks,
    "areaServed": {
      "@type": "Country",
      "name": "Saudi Arabia"
    }
  };

  return (
    <>
      {/* ✅ Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(organizationSchema)}
      />
      
      {/* ✅ Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(websiteSchema)}
      />
      
      {/* ✅ Local Business Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderSchema(localBusinessSchema)}
      />
      
      {/* محتوى الصفحة */}
      <main>
        <BannerSlider />
        <StoriesSlider />
        
        {/* سلايدر لكل تصنيف */}
        {sliders.map(({ category, products }) =>
          products.length > 0 ? (
            <ProductSlider
              key={category.id}
              category={category}
              products={products}
            />
          ) : null
        )}
      </main>
    </>
  );
}
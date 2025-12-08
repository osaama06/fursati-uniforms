// app/manifest.js
export default function manifest() {
  return {
    name: 'Fursati -متجر فرصتي للزي الموحد',
    short_name: 'Fursati',
    description: 'متجر فرصتي المتخصص في بيع الزي المدرسي والطبي الموحد',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0070f3',
    orientation: 'portrait',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    categories: ['shopping', 'lifestyle'],
    shortcuts: [
      {
        name: 'المنتجات',
        url: '/products',
        description: 'تصفح جميع المنتجات'
      },
      {
        name: 'الفئات',
        url: '/categories',
        description: 'تصفح الفئات'
      }
    ]
  };
}
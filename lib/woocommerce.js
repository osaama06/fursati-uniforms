// lib/woocommerce.js
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const verifyEnvVariables = () => {
  const requiredVars = ["WOO_URL", "WOO_CONSUMER_KEY", "WOO_SECRET_KEY"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }

  if (!process.env.WOO_URL.startsWith("http")) {
    throw new Error("WOO_URL must start with http:// or https://");
  }
};

let woocommerceApi;

try {
  verifyEnvVariables();

  woocommerceApi = new WooCommerceRestApi({
    url: process.env.WOO_URL,
    consumerKey: process.env.WOO_CONSUMER_KEY,
    consumerSecret: process.env.WOO_SECRET_KEY,
    version: "wc/v3",
    queryStringAuth: true,
    axiosConfig: {
      timeout: 30000,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
        // ✅ إزالة Accept-Encoding لتعطيل الضغط
      },
      decompress: true // ✅ إضافة هذا لفك الضغط تلقائياً
    },
  });

  console.log('✅ WooCommerce API initialized successfully');

} catch (error) {
  console.error("❌ Failed to initialize WooCommerce API:", error.message);

  woocommerceApi = {
    get: () => Promise.reject(error),
    post: () => Promise.reject(error),
    put: () => Promise.reject(error),
    delete: () => Promise.reject(error),
  };
}

export default woocommerceApi;
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import woocommerceApi from "@/lib/woocommerce";

const secret = process.env.JWT_SECRET || "@#Yt5$Dsdg6@!#dfghASD987";

export async function POST(req) {
  try {
    // قراءة البودي بالكامل
    const rawBody = await req.text();
    const body = JSON.parse(rawBody || "{}");

    console.log("🚀 البيانات المرسلة من العميل:", body);

    const { cartItems, address, city, state, postcode, country } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "السلة فارغة" }, { status: 400 });
    }

    // قراءة الكوكيز لاستخراج التوكن
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "المستخدم غير مسجل الدخول" }, { status: 401 });
    }

    // فك التوكن للحصول على بيانات المستخدم
    const payload = jwt.verify(token, secret);
    console.log("🧩 بيانات المستخدم من JWT:", payload);

    const customer_id = payload.customer_id || payload.id || null;

    // بناء بيانات المنتجات
    const line_items = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));

    // بناء بيانات الطلب
    const orderData = {
      payment_method: "cod",
      payment_method_title: "الدفع عند الاستلام",
      set_paid: false,
      customer_id,
      billing: {
        first_name: payload.name || "عميل",
        email: payload.email || "noemail@example.com",
        address_1: address || "",
        city: city || "",
        state: state || "",
        postcode: postcode || "",
        country: country || "SA"
      },
      shipping: {
        first_name: payload.name || "عميل",
        address_1: address || "",
        city: city || "",
        state: state || "",
        postcode: postcode || "",
        country: country || "SA"
      },
      line_items
    };

    console.log("📦 البيانات المرسلة إلى WooCommerce:", orderData);

    // إرسال الطلب إلى WooCommerce
    const { data } = await woocommerceApi.post("orders", orderData);

    console.log("✅ تم إنشاء الطلب بنجاح:", data.id);
    return NextResponse.json({ success: true, order: data });

  } catch (error) {
    console.error("❌ خطأ أثناء إنشاء الطلب:", error.response?.data || error.message);
    return NextResponse.json({
      error: error.response?.data || "فشل إنشاء الطلب"
    }, { status: 500 });
  }
}

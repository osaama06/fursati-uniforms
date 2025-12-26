export async function POST(req) {
  const body = await req.json();
  const { email, password, first_name, last_name, phone } = body;

  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");

  try {
    const response = await fetch("https://furssati.io/wp-json/wc/v3/customers", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username: email, // نستخدم الإيميل كإسم مستخدم للسهولة
        password,
        first_name,
        last_name,
        billing: {
          first_name,
          last_name,
          email,
          phone
        },
        shipping: {
          first_name,
          last_name,
          phone
        }
      }),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      return Response.json({ success: true, user: data });
    } else {
      // إرجاع رسالة الخطأ من ووردبريس (مثل: البريد مسجل مسبقاً)
      const errorMsg = data.code === "registration-error-email-exists" 
        ? "هذا البريد الإلكتروني مسجل مسبقاً." 
        : "فشل في إنشاء الحساب.";
      
      return Response.json({ success: false, message: errorMsg }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ success: false, message: "خطأ في الاتصال بالسيرفر." }, { status: 500 });
  }
}
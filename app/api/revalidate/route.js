// app/api/revalidate/route.js
//
// يستقبل Webhooks من WooCommerce ويحدّث الصفحات المخزنة فوراً
// بدل ما تنتظر ساعة (revalidate = 3600).
//
// المطلوب في Vercel → Environment Variables:
//   WOO_WEBHOOK_SECRET = نفس الـ Secret اللي تحطه في WooCommerce Webhook

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =============================
// التحقق من توقيع WooCommerce
// =============================
// WooCommerce يرسل: X-WC-Webhook-Signature = base64(HMAC-SHA256(body, secret))
function isValidSignature(rawBody, signature) {
  const secret = process.env.WOO_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  // لازم نقرأ الـ body كنص خام عشان التوقيع يطابق
  const rawBody = await request.text();

  // WooCommerce يرسل "ping" لما تنشئ الـ Webhook أول مرة
  // (بدون توقيع، وبصيغة webhook_id=123) — نرد 200 عشان يقبله
  if (rawBody.startsWith("webhook_id=")) {
    return NextResponse.json({ ok: true, ping: true });
  }

  const signature = request.headers.get("x-wc-webhook-signature");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 401 }
    );
  }

  const topic = request.headers.get("x-wc-webhook-topic") || "unknown";

  let payload = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // نكمل حتى لو الـ body مو JSON — التحديث ما يعتمد عليه
  }

  try {
    // كل صفحات المنتجات
    // (أضمن من مسار منتج واحد بسبب ترميز الروابط العربية،
    //  والصفحات تنبني من جديد فقط عند أول زيارة بعدها)
    revalidatePath("/products/[slug]", "page");

    // صفحة كل المنتجات + التصنيفات + الرئيسية + الـ sitemap
    revalidatePath("/products");
    revalidatePath("/[slug]", "page");
    revalidatePath("/");
    revalidatePath("/sitemap.xml");

    console.log(
      `✅ Revalidated (${topic}) — id: ${payload?.id ?? "-"}, slug: ${
        payload?.slug ?? "-"
      }`
    );

    return NextResponse.json({ ok: true, topic });
  } catch (error) {
    console.error("Revalidate error:", error);
    return NextResponse.json(
      { ok: false, error: "Revalidate failed" },
      { status: 500 }
    );
  }
}
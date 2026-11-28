// app/api/upload-image/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });
    }

    // التحقق من النوع — نفس قائمة صفحة المنتج بالضبط (كان السيرفر يقبل gif والواجهة لا)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. يرجى رفع صورة JPG أو PNG أو WEBP' }, { status: 400 });
    }

    // التحقق من الحجم (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم الصورة كبير جداً. الحد الأقصى 5MB' }, { status: 400 });
    }

    // تحويل الملف لـ buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // رفع لـ Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'furssati-orders',   // مجلد ثابت — لا يتحكم فيه العميل
          // resource_type: 'image' هو الحامي الفعلي — file.type يجي من العميل
          // وقابل للتلاعب، وكلاوديناري يرفض اللي ما هو صورة.
          resource_type: 'image',
          overwrite: false,            // ما نكتب فوق أصل موجود
          unique_filename: true,       // اسم عشوائي لكل رفعة
          use_filename: false,         // ما نستخدم اسم ملف العميل
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url:       result.secure_url,
      public_id: result.public_id,
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'فشل رفع الصورة' }, { status: 500 });
  }
}
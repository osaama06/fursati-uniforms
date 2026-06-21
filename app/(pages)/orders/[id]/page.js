import Link from 'next/link';

async function getOrderDetails(orderId) {
  const auth = Buffer.from(`${process.env.WOO_CONSUMER_KEY}:${process.env.WOO_SECRET_KEY}`).toString("base64");
  try {
    const res = await fetch(`https://fursatiuniforms.store/wp-json/wc/v3/orders/${orderId}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store'
    });
    return res.ok ? await res.json() : null;
  } catch (error) { return null; }
}

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;
  const order = await getOrderDetails(id);

  if (!order) return <div style={{ textAlign: 'center', padding: '5rem' }}>الطلب غير موجود</div>;

  const steps = [
    { label: 'تم الطلب', status: ['pending', 'processing', 'on-hold', 'completed'] },
    { label: 'قيد التجهيز', status: ['processing', 'completed'] },
    { label: 'تم الشحن', status: ['completed'] }, // أو أضف حالة 'shipped' إذا كانت مفعلة لديك
    { label: 'تم التسليم', status: ['completed'] }
  ];

  return (
    <main dir="rtl" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem', color: '#2d3748' }}>
      
      {/* الهيدر المحسن */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <Link href="/orders" style={{ color: '#00c2cb', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>← العودة للسجل</Link>
          <h1 style={{ margin: '0.5rem 0', fontSize: '1.8rem' }}>تفاصيل طلبك #{order.id}</h1>
          <p style={{ color: '#718096', fontSize: '0.9rem' }}>تاريخ الطلب: {new Date(order.date_created).toLocaleDateString('ar-SA')}</p>
        </div>
        <div style={{ background: '#e6fcf5', color: '#0ca678', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' }}>
          الحالة: {order.status === 'completed' ? 'مكتمل' : 'قيد المتابعة'}
        </div>
      </header>

      {/* 🚀 التايم لاين (مع إصلاح مظهر الخط) */}
      <section style={{ background: '#fff', padding: '2.5rem 1.5rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {steps.map((step, index) => {
            const isDone = step.status.includes(order.status);
            return (
              <div key={index} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '35px', height: '35px', borderRadius: '50%', margin: '0 auto 10px',
                  background: isDone ? '#00c2cb' : '#f1f5f9', color: isDone ? '#fff' : '#cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                  border: '4px solid #fff', boxShadow: '0 0 0 1px #e2e8f0'
                }}>
                  {isDone ? '✓' : index + 1}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isDone ? '#2d3748' : '#a0aec0' }}>{step.label}</span>
                
                {/* الخط الواصل - يظهر فقط بين الدوائر */}
                {index < steps.length - 1 && (
                  <div style={{
                    position: 'absolute', top: '18px', left: '-50%', width: '100%', height: '2px',
                    background: isDone ? '#00c2cb' : '#f1f5f9', zIndex: -1
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* المحتوى الرئيسي */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* المنتجات */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🛒 المنتجات في شحنتك</h3>
          {order.line_items.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #f8fafc' }}>
               <div style={{ width: '50px', height: '50px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
               <div style={{ flex: 1 }}>
                 <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.name}</h4>
                 <p style={{ margin: 0, fontSize: '0.8rem', color: '#718096' }}>الكمية: {item.quantity} × {item.price} ر.س</p>
               </div>
               <div style={{ fontWeight: 'bold' }}>{item.total} ر.س</div>
            </div>
          ))}
        </div>

        {/* ملخص الدفع وعنوان الشحن */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* الملخص */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
            <h3 style={{ marginBottom: '1rem' }}>💰 تفاصيل الدفع</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span>المجموع الفرعي</span>
              <span>{order.total} ر.س</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed #eee' }}>
              <span style={{ fontWeight: 'bold' }}>الإجمالي الكلي</span>
              <span style={{ fontWeight: '900', fontSize: '1.3rem', color: '#00c2cb' }}>{order.total} ر.س</span>
            </div>
          </div>

          {/* 📍 عنوان الشحن */}
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1rem' }}>📍 عنوان الشحن</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: '#4a5568' }}>
              {order.shipping.first_name} {order.shipping.last_name}<br />
              {order.shipping.address_1}<br />
              {order.shipping.city}، {order.shipping.state}<br />
              {order.shipping.phone}
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
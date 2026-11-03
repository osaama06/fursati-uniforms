'use client';

export default function OrderCard({ order }) {
  if (!order) {
    return <div>لا توجد بيانات للطلب</div>; // رسالة بديلة لو لم تتوفر بيانات الطلب
  }

  const statusMap = {
    pending: 'قيد الانتظار',
    processing: 'قيد التجهيز',
    completed: 'خالص',
    on_hold: 'معلّق',
    cancelled: 'ملغي',
    refunded: 'مُسترد',
    failed: 'فشل',
  };

  const statusColors = {
    pending: '#f0ad4e',
    processing: '#5bc0de',
    completed: '#5cb85c',
    cancelled: '#d9534f',
    refunded: '#9370DB',
    failed: '#d9534f',
    on_hold: '#f7a35c',
  };

  const status = order.status || 'unknown';
  const statusLabel = statusMap[status] || status;
  const statusColor = statusColors[status] || '#999';

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '10px',
      padding: '1rem',
      marginBottom: '1.5rem',
      background: '#f9f9f9',
    }}>
      <h3 style={{ margin: 0 }}>طلب #{order.id || 'غير معروف'}</h3>
      <p style={{ margin: '5px 0' }}>
        <span style={{
          backgroundColor: statusColor,
          color: '#fff',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          {statusLabel}
        </span>
      </p>
      <p>الإجمالي: {order.total || 'غير معروف'} ر.س</p>
      <p>تاريخ الطلب: {order.date_created ? new Date(order.date_created).toISOString().split('T')[0] : 'غير معروف'}</p>

      <ul style={{ paddingRight: '1rem' }}>
        {(order.line_items || []).map(item => (
          <li key={item.id}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

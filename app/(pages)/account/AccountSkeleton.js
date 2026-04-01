export default function AccountSkeleton() {
  const pulse = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'accountPulse 1.5s ease-in-out infinite',
    borderRadius: '10px',
  };

  return (
    <>
      <style>{`
        @keyframes accountPulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div dir="rtl" style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px' }}>

          {/* Sidebar skeleton */}
          <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f0f0f0', padding: '20px' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ ...pulse, height: '44px', marginBottom: '8px' }} />
            ))}
          </div>

          {/* Content skeleton */}
          <div>
            <div style={{ ...pulse, height: '72px', borderRadius: '20px', marginBottom: '20px' }} />
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #f0f0f0', padding: '28px' }}>
              <div style={{ ...pulse, height: '20px', width: '40%', marginBottom: '20px' }} />
              {[1,2,3].map(i => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div style={{ ...pulse, height: '14px', width: '25%', marginBottom: '8px' }} />
                  <div style={{ ...pulse, height: '44px' }} />
                </div>
              ))}
              <div style={{ ...pulse, height: '48px', marginTop: '10px' }} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
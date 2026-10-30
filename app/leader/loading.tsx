export default function LeaderLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9704E', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }} dir="rtl">
      <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255, 255, 255, 0.3)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ fontSize: '16px', fontFamily: 'Tahoma', fontWeight: 'bold' }}>در حال ورود به پنل لیدر...</p>
    </div>
  );
}
export default function LeaderLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '[#F9704E]', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #F9704E', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
      <p style={{ fontSize: '14px', fontFamily: 'Tahoma' }}>در حال ورود به پنل لیدر...</p>
    </div>
  );
}
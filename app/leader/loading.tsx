export default function LeaderLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#061421', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #F9704E', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
      <p style={{ fontSize: '18px', fontFamily: 'Tahoma' }}>در حال ورود به پنل لیدر...</p>
    </div>
  );
}
// type: 'back' | 'home'
export default function Icons({ type, size = 24 }) {
  if (type === 'back') {
    // Material Symbols: arrow_back_ios_new (rounded)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }}>
        <path d="M15.71 6.71a1 1 0 0 0-1.42-1.42l-6 6a1 1 0 0 0 0 1.42l6 6a1 1 0 1 0 1.42-1.42L10.83 12l4.88-5.29z" fill="currentColor"/>
      </svg>
    );
  }
  if (type === 'home') {
    // Material Symbols: home (rounded)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }}>
        <path d="M10.707 3.293a1 1 0 0 1 1.414 0l7.586 7.586a1 1 0 0 1-1.414 1.414L19 12.414V19a2 2 0 0 1-2 2h-2.5a.5.5 0 0 1-.5-.5V16a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4.5a.5.5 0 0 1-.5.5H7a2 2 0 0 1-2-2v-6.586l.707.707A1 1 0 0 1 4.293 10.88l7.586-7.586z" fill="currentColor"/>
      </svg>
    );
  }
  return null;
}

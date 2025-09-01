// type: 'back' | 'home' | 'add' | 'pen' | 'eraser' | 'image' | 'dots' | 'undo'
export default function Icons({ type, size = 24, color }) {
  if (type === 'back') {
    // ...existing code...
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }}>
        <path d="M15.71 6.71a1 1 0 0 0-1.42-1.42l-6 6a1 1 0 0 0 0 1.42l6 6a1 1 0 1 0 1.42-1.42L10.83 12l4.88-5.29z" fill="currentColor"/>
      </svg>
    );
  }
  if (type === 'home') {
    // ...existing code...
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }}>
        <path d="M10.707 3.293a1 1 0 0 1 1.414 0l7.586 7.586a1 1 0 0 1-1.414 1.414L19 12.414V19a2 2 0 0 1-2 2h-2.5a.5.5 0 0 1-.5-.5V16a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4.5a.5.5 0 0 1-.5.5H7a2 2 0 0 1-2-2v-6.586l.707.707A1 1 0 0 1 4.293 10.88l7.586-7.586z" fill="currentColor"/>
      </svg>
    );
  }
  if (type === 'add') {
    // ...existing code...
    return (
      <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5.25" y="2" width="1.5" height="8" rx="0.75" fill={color || '#A1A1A1'}/>
        <rect x="2" y="5.25" width="8" height="1.5" rx="0.75" fill={color || '#A1A1A1'}/>
      </svg>
    );
  }
  if (type === 'pen') {
    // Material Symbols: edit (rounded)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill={color || 'none'} fillOpacity="0" />
        <path d="M6 17.25V18h.75l7.06-7.06-.75-.75L6 17.25zm9.71-9.04a1 1 0 0 0-1.41 0l-1.13 1.13.75.75 1.13-1.13a1 1 0 0 0 0-1.41z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (type === 'eraser') {
    // Material Symbols: ink_eraser (rounded)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="15" width="16" height="2" rx="1" fill={color || 'currentColor'} fillOpacity="0.1" />
        <path d="M7 14l7-7a2 2 0 0 1 2.83 2.83l-7 7a2 2 0 0 1-2.83-2.83z" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    );
  }
  if (type === 'image') {
    // Material Symbols: add_photo_alternate (rounded)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 13l2.5 3.5 3.5-4.5 4 6" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8.5" cy="9.5" r="1.5" fill={color || 'currentColor'} />
        <path d="M19 7v-2m0 0h-2m2 0v2m0-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  if (type === 'dots') {
    // Material Symbols: blur_on (rounded, for brush size)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="9" cy="12" r="1.5" fill={color || 'currentColor'} />
        <circle cx="12" cy="12" r="1.5" fill={color || 'currentColor'} />
        <circle cx="15" cy="12" r="1.5" fill={color || 'currentColor'} />
      </svg>
    );
  }
  if (type === 'undo') {
    // Material Symbols: undo (rounded)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v2a7 7 0 1 1-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 12l4-4m-4 4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  return null;
}

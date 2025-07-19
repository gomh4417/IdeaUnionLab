// 구글 아이콘 SVG 컴포넌트 모음
// 필요한 아이콘만 export

export function IconNext(props) {
  return (
    <svg width={props.size || 32} height={props.size || 32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 8l8 8-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconAdd(props) {
  return (
    <svg width={props.size || 32} height={props.size || 32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M16 8v16M8 16h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconDown(props) {
  return (
    <svg width={props.size || 32} height={props.size || 32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M8 12l8 8 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconDelete(props) {
  return (
    <svg width={props.size || 32} height={props.size || 32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 12l8 8M20 12l-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="8" y="8" width="16" height="16" rx="8" stroke="currentColor" strokeWidth="2.5"/>
    </svg>
  );
}

export function IconBack(props) {
  return (
    <svg width={props.size || 32} height={props.size || 32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M20 8l-8 8 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// iconName에 따라 컴포넌트 반환
export function getActionIcon(iconName, props) {
  switch (iconName) {
    case 'next': return <IconNext {...props} />;
    case 'add': return <IconAdd {...props} />;
    case 'down': return <IconDown {...props} />;
    case 'delete': return <IconDelete {...props} />;
    case 'back': return <IconBack {...props} />;
    default: return null;
  }
}

import React from 'react';

// type: 'back' | 'home' | 'add' | 'pen' | 'eraser' | 'image' | 'dots' | 'undo' | 'upload'
// 구글 머티리얼 아이콘 폰트 기반으로 렌더링
const typeToIconName = {
  back: 'arrow_back',
  home: 'home',
  add: 'add',
  pen: 'edit',
  eraser: 'ink_eraser',
  image: 'add_photo_alternate',
  dots: 'blur_on',
  undo: 'undo',
  upload: 'upload',
};

export default function Icons({ type, size = 24, color = 'inherit', style = {}, ...rest }) {
  const iconName = typeToIconName[type] || type;
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, color, ...style }}
      {...rest}
    >
      {iconName}
    </span>
  );
}

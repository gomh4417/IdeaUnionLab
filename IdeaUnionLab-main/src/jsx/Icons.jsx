import React from 'react';
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
  edit: 'edit',
  save: 'save',
  settings: 'settings',
  delete: 'delete',
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

import Item from './Item';

export default function ItemList({ items = [], activatedIdx = null, onDeleteItem, originalItems = [], onDragStateChange }) {
  // 필터링된 아이템의 원본 인덱스를 찾는 함수
  const findOriginalIndex = (filteredIndex) => {
    const targetItem = items[filteredIndex];
    if (!targetItem) return -1;
    
    // 원본 배열에서 같은 ID를 가진 아이템의 인덱스 찾기
    return originalItems.findIndex(item => item.id === targetItem.id);
  };

  // 삭제 함수 래퍼
  const handleDelete = (filteredIndex) => {
    const originalIndex = findOriginalIndex(filteredIndex);
    if (originalIndex !== -1) {
      onDeleteItem(originalIndex);
    } else {
      console.error('원본 배열에서 해당 아이템을 찾을 수 없습니다.');
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"8px" }}>
      {items.map((item, idx) => (
        <Item
          key={item.id || idx}
          idx={idx}
          imageUrl={item.imageUrl}
          title={item.title}
          tags={item.tags}
          type={activatedIdx === idx ? 'activated' : 'default'}
          onDelete={handleDelete}
          itemData={item}
          onDragStateChange={onDragStateChange}
        />
      ))}
    </div>
  );
}

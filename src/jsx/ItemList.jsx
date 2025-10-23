import Item from './Item';

export default function ItemList({ items = [], activatedIdx = null, onDeleteItem, originalItems = [], onDragStateChange, onItemSelect }) {
  // ID 기반 삭제 함수
  const handleDelete = (filteredIndex) => {
    const targetItem = items[filteredIndex];
    if (!targetItem || !targetItem.id) {
      console.error('삭제할 아이템의 ID를 찾을 수 없습니다.');
      return;
    }
    
    // ID를 전달하여 삭제
    onDeleteItem(targetItem.id);
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
          onItemSelect={onItemSelect}
        />
      ))}
    </div>
  );
}

import Item from './Item';

export default function ItemList({ items = [], activatedIdx = null, onDeleteItem }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"8px" }}>
      {items.map((item, idx) => (
        <Item
          key={idx}
          idx={idx}
          imageUrl={item.imageUrl}
          title={item.title}
          type={activatedIdx === idx ? 'activated' : 'default'}
          onDelete={onDeleteItem}
        />
      ))}
    </div>
  );
}

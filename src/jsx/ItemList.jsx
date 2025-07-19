import Item from './Item';

export default function ItemList({ items = [], activatedIdx = null, onItemClick }) {
  return (
    <div>
      {items.map((item, idx) => (
        <Item
          key={idx}
          imageUrl={item.imageUrl}
          title={item.title}
          type={activatedIdx === idx ? 'activated' : 'default'}
          onClick={() => onItemClick?.(activatedIdx === idx ? null : idx)}
        />
      ))}
    </div>
  );
}

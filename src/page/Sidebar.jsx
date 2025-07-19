
import { useState } from 'react';
import DeleteBtn from './DeleteBtn';

const PLACEHOLDER_IMAGE = 'https://cdn.pixabay.com/photo/2011/04/03/13/35/bread-6047_1280.jpg';

let itemsData = [
  {
    id: '1',
    name: '스마트 전기포트',
    tags: '#IoT #노인',
    category: 'result',
    image: PLACEHOLDER_IMAGE
  },
  {
    id: '2',
// ...existing code...
    tags: '#접이식 #도서관',
    category: 'result',
    image: PLACEHOLDER_IMAGE
  },
  {
    id: '3',
    name: 'Smart AIoT Healthcare Devices',
    tags: '#IoT #헬스케어',
    category: 'result',
    image: PLACEHOLDER_IMAGE
  },
  {
    id: '4',
    name: '모듈형 소파 테이블',
    tags: '#모듈형 #재활용',
    category: 'raw',
    image: PLACEHOLDER_IMAGE
  }
];

function Frame2147225269({ onClick }) {
  return (
    <div className="size-12 relative cursor-pointer" onClick={onClick}>
      <div className="absolute inset-[-1.042%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 50 50"
        >
          <g id="Frame 2147225269">
            <rect
              height="48"
              rx="8"
              stroke="#A1A1A1"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="48"
              x="1"
              y="1"
            />
            <path 
              d="M25 17.5V32.5M17.5 25H32.5" 
              fill="#A1A1A1" 
              stroke="#A1A1A1"
              strokeWidth="2"
              strokeLinecap="round"
              id="+" 
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function AddItem({ onAddItem }) {
  const AddItemFrame = () => (
    <div className="box-border content-stretch flex flex-row gap-3 items-center justify-start p-0 relative rounded-xl">
      <Frame2147225269 onClick={onAddItem} />
      <div className="box-border content-stretch flex flex-col font-['Pretendard:Regular',_sans-serif] gap-0.5 items-start justify-center leading-[0] not-italic p-0 relative shrink-0 text-left min-w-0 flex-1">
        <div className="relative shrink-0 text-[#5b5b5b] text-[14px] tracking-[-0.28px] truncate w-full">
          <p className="adjustLetterSpacing block leading-[1.4] truncate">
            원재료 추가하기
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-[220px] h-16 relative shrink-0" data-name="AddItem">
      <div className="absolute flex items-center justify-start left-3 top-1/2 translate-y-[-50%] h-12 w-[196px]">
        <AddItemFrame />
      </div>
    </div>
  );
}

  item, 
  isActive, 
  onClick, 
  isSwiped,
  onSwipe,
  onDelete 
// ...existing code...
  const [startX, setStartX] = useState(null);
  const [currentX, setCurrentX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  const handleStart = (clientX) => {
    setStartX(clientX);
    setCurrentX(clientX);
    setIsDragging(true);
    setHasMoved(false);
  };

  const handleMove = (clientX) => {
    if (!isDragging || startX === null) return;
    setCurrentX(clientX);
    
    // 5px 이상 움직였으면 드래그로 판단
    if (Math.abs(clientX - startX) > 5) {
      setHasMoved(true);
    }
  };

  const handleEnd = () => {
    if (!isDragging || startX === null || currentX === null) {
      setIsDragging(false);
      setStartX(null);
      setCurrentX(null);
      setHasMoved(false);
      return;
    }

    const deltaX = currentX - startX;
    
    // 움직임이 거의 없으면 클릭으로 판단
    if (!hasMoved && Math.abs(deltaX) < 5) {
      if (!isSwiped) {
        onClick();
      }
    } else if (deltaX < -50) { // 좌측으로 50px 이상 스와이프
      onSwipe();
    } else if (deltaX > 50 && isSwiped) { // 우측으로 50px 이상 스와이프하고 현재 스와이프된 상태면
      onSwipe(); // 원래 상태로 복귀
    }

    setIsDragging(false);
    setStartX(null);
    setCurrentX(null);
    setHasMoved(false);
  };


  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const ItemImage = () => (
    <div
      className="bg-[#f1f1f1] overflow-clip relative rounded-lg shrink-0 size-12"
      data-name="그리드"
    >
      <div
        className="absolute bg-center bg-cover bg-no-repeat left-0 size-12 top-0 rounded-lg"
        data-name="image"
        style={{ backgroundImage: `url('${item.image}')` }}
      />
    </div>
  );

  const ItemText = () => (
    <div className="box-border content-stretch flex flex-col font-['Pretendard:Regular',_sans-serif] gap-0.5 items-start justify-center leading-[0] not-italic p-0 relative shrink-0 text-left min-w-0 flex-1">
      <div className="relative shrink-0 text-[#000000] text-[14px] tracking-[-0.28px] truncate w-full">
        <p className="adjustLetterSpacing block leading-[1.4] truncate">
          {item.name}
        </p>
      </div>
      <div className="relative shrink-0 text-[#969696] text-[12px] tracking-[-0.24px] truncate w-full">
        <p className="adjustLetterSpacing block leading-[1.4] truncate">
          {item.tags}
        </p>
      </div>
    </div>
  );

  const ItemFrame = () => (
    <div className="box-border content-stretch flex flex-row gap-3 items-center justify-start p-0 relative rounded-xl w-full">
      <ItemImage />
      <ItemText />
    </div>
  );

  const translateX = isSwiped ? -44 : 0; // 44px = delete button width

  if (isActive) {
    return (
      <div className="w-[220px] h-16 relative shrink-0 overflow-hidden">
        <div
          className="bg-[rgba(0,122,255,0.04)] w-[220px] h-16 overflow-clip relative cursor-pointer transition-transform duration-200 ease-out"
          data-name="Item_Active"
          style={{ transform: `translateX(${translateX}px)` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute flex items-center justify-start left-3 top-1/2 translate-y-[-50%] h-12 w-[196px]">
            <ItemFrame />
          </div>
          <div className="absolute left-0 top-1/2 translate-y-[-50%] w-1 h-16 bg-[#007aff] rounded-[1px]" />
        </div>
        <DeleteBtn onDelete={onDelete} isVisible={isSwiped} />
      </div>
    );
  }

  return (
    <div className="w-[220px] h-16 relative shrink-0 overflow-hidden">
      <div 
        className="w-[220px] h-16 relative cursor-pointer transition-transform duration-200 ease-out" 
        data-name="Item"
        style={{ transform: `translateX(${translateX}px)` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute flex items-center justify-start left-3 top-1/2 translate-y-[-50%] h-12 w-[196px]">
          <ItemFrame />
        </div>
      </div>
      <DeleteBtn onDelete={onDelete} isVisible={isSwiped} />
    </div>
  );
}

  label, 
  isActive, 
  onClick 
}) {
  return (
    <div
      className={`box-border content-stretch flex flex-row h-[45px] items-center justify-center px-2.5 py-0.5 relative rounded w-[110px] cursor-pointer ${
        isActive 
          ? 'bg-[rgba(0,122,255,0.04)] rounded-lg' 
          : ''
      }`}
      onClick={onClick}
    >
      <div className={`font-['Pretendard:${isActive ? 'SemiBold' : 'Medium'}',_sans-serif] leading-[0] not-italic relative shrink-0 text-[${isActive ? '#3d3d40' : '#cccccc'}] text-[14px] text-center text-nowrap`}>
        <p className="block leading-[1.625] whitespace-pre">{label}</p>
      </div>
    </div>
  );
}

  activeFilter, onFilterChange 
}) {
  return (
    <div
      className="absolute box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 left-2 top-2 w-[220px]"
      data-name="BtmWrap"
    >
      <FilterButton 
        label="원재료" 
        isActive={activeFilter === 'raw'} 
        onClick={() => onFilterChange('raw')}
      />
      <FilterButton 
        label="생성물" 
        isActive={activeFilter === 'result'} 
        onClick={() => onFilterChange('result')}
      />
    </div>
  );
}

  items, 
  activeItemId, 
  onItemClick, 
  onAddItem,
  swipedItemId,
  onSwipeItem,
  onDeleteItem
}) {
  return (
    <div
      className="absolute box-border content-stretch flex flex-col gap-2 w-[220px] items-start justify-start left-2 p-0 top-[73px]"
      data-name="ItemList"
    >
      <AddItem onAddItem={onAddItem} />
      {items.map((item) => (
        <ItemComponent
          key={item.id}
          item={item}
          isActive={activeItemId === item.id}
          onClick={() => onItemClick(item.id)}
          isSwiped={swipedItemId === item.id}
          onSwipe={() => onSwipeItem(item.id)}
          onDelete={() => onDeleteItem(item.id)}
        />
      ))}
    </div>
  );
}

export default function InteractiveSidebar() {
  const [activeFilter, setActiveFilter] = useState('raw');
  const [activeItemId, setActiveItemId] = useState('4'); // 모듈형 소파 테이블이 raw 카테고리에서 기본 선택
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [items, setItems] = useState(itemsData);

  const filteredItems = items.filter(item => item.category === activeFilter);

  const handleItemClick = (itemId) => {
    // 스와이프된 아이템이 있으면 모든 스와이프 상태 해제
    if (swipedItemId) {
      setSwipedItemId(null);
      return;
    }
    setActiveItemId(activeItemId === itemId ? null : itemId);
  };

  const handleAddItem = () => {
    // 랜덤한 이름 생성을 위한 배열
    const rawMaterialNames = [
      '새 원재료', '고급 소재', '친환경 재료', '재활용 소재', '스마트 재료',
      '바이오 소재', '복합 재료', '경량 소재', '내구성 재료', '혁신 소재'
    ];

    const resultNames = [
      '새 생성물', '스마트 제품', '혁신 디바이스', '친환경 제품', 'IoT 기기',
      '모듈형 제품', '다기능 도구', '지능형 시스템', '휴대용 기기', '맞춤형 솔루션'
    ];

    const tags = ['#새로운', '#혁신', '#스마트', '#친환경', '#모듈형', '#IoT', '#다기능', '#맞춤형'];

    const availableNames = activeFilter === 'raw' ? rawMaterialNames : resultNames;
    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    const randomTag = tags[Math.floor(Math.random() * tags.length)];

    // 현재 필터에 맞는 새 아이템 생성
    const newItem = {
      id: Date.now().toString(), // 유니크한 ID 생성
      name: randomName,
      tags: randomTag,
      category: activeFilter,
      image: PLACEHOLDER_IMAGE
    };

    // 아이템 목록에 추가
    setItems(prevItems => [...prevItems, newItem]);

    // 새로 추가된 아이템을 활성화
    setActiveItemId(newItem.id);

    // 스와이프 상태 초기화
    setSwipedItemId(null);

    console.log('새 아이템 추가됨:', newItem);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // 필터가 변경되면 활성 아이템과 스와이프 상태 초기화
    setActiveItemId(null);
    setSwipedItemId(null);
  };

  const handleSwipeItem = (itemId) => {
    setSwipedItemId(swipedItemId === itemId ? null : itemId);
  };

  const handleDeleteItem = (itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    setSwipedItemId(null);
    if (activeItemId === itemId) {
      setActiveItemId(null);
    }
  };

  return (
    <div
      className="bg-[#ffffff] relative rounded-xl shadow-[0px_0px_4px_0px_rgba(0,0,0,0.1),0px_4px_8px_0px_rgba(0,0,0,0.1)] size-full"
      data-name="sidebar"
      onClick={() => {
        // 사이드바 클릭 시 스와이프 상태 해제
        if (swipedItemId) {
          setSwipedItemId(null);
        }
      }}
    >
      <div className="absolute flex items-center justify-center left-0 top-0 w-[236px] h-[724px]">
        <div className="bg-[#ffffff] w-[236px] h-[724px] rounded-xl" />
      </div>

      <ItemList 
        items={filteredItems}
        activeItemId={activeItemId}
        onItemClick={handleItemClick}
        onAddItem={handleAddItem}
        swipedItemId={swipedItemId}
        onSwipeItem={handleSwipeItem}
        onDeleteItem={handleDeleteItem}
      />

      <div className="absolute flex items-center justify-center left-0 top-[61px] w-[236px] h-[0px]">
        <div className="w-[236px] h-0 relative">
          <div className="absolute left-0 right-0 top-[-0.5px] bottom-0">
            <svg
              className="block size-full"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 236 1"
            >
              <line
                id="Line 287"
                stroke="#EEEEEE"
                strokeWidth="0.5"
                x1="0"
                x2="236"
                y1="0.75"
                y2="0.75"
              />
            </svg>
          </div>
        </div>
      </div>

      <BtmWrap 
        activeFilter={activeFilter} 
        onFilterChange={handleFilterChange} 
      />
    </div>
  );
}

import styled from 'styled-components';
import { theme } from '../styles/theme';
import { useDrag } from 'react-dnd';
import Icons from '../jsx/Icons';
import { useState } from 'react';

const ItemWrap = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  transform: translateX(-14px) ${({ $slid }) => $slid ? 'translateX(-44px)' : ''};
  height: 64px;
  margin: 0px 14px;
  padding: 8px 0px 8px 10px;
  cursor: pointer;
  background: ${({ $type }) => $type === 'activated' ? theme.colors.secondary : '#fff'};
  border-left: 4px solid ${({ $type }) => $type === 'activated' ? theme.colors.primary : 'transparent'};
  transition: background 0.2s, border-color 0.2s, transform 0.25s cubic-bezier(0.4,0,0.2,1);
  box-sizing: border-box;
  position: relative;
`;
const DeleteArea = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  width: 60px;
  height: 100%;
  z-index: 2;
  cursor: pointer;
`;

const DeleteBtn = styled.button`
  position: absolute;
  right: -44px;
  top: 0px;
  width: 44px;
  height: 64px;
  background: #FF3B30;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  z-index: 3;
  opacity: ${({ $show }) => $show ? 1 : 0};
  pointer-events: ${({ $show }) => $show ? 'auto' : 'none'};
  transition: opacity 0.2s;
`;

const ImgBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${theme.radius.medium};
  background: #eee;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0;
  margin-right: 14px;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: ${theme.colors.gray[900]};
  margin-bottom: 2px;
  line-height: 140%;
  letter-spacing: -0.02em;
  max-width: 132px;
`;

const Tag = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: ${theme.colors.gray[500]};
  line-height: 140%;
  letter-spacing: -0.02em;
`;

export default function Item({
  imageUrl,
  title,
  type = 'default',
  idx,
  onDelete,
  tags = [],
  itemData,
  onDragStateChange,
  onItemSelect,
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ITEM',
    
    item: () => {
      onDragStateChange?.(true);
      return { idx, imageUrl, title, itemData };
    },
    end: () => {
      onDragStateChange?.(false);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // 슬라이드 상태 관리
  const [slid, setSlid] = useState(false);
  
  // 스와이프 제스처 감지 상태
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // 최소 스와이프 거리 (픽셀)
  const minSwipeDistance = 50;

  // DeleteArea 클릭 시 슬라이드
  const handleDeleteAreaClick = (e) => {
    e.stopPropagation();
    setSlid(true);
  };
  
  // 터치 시작
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  // 터치 이동
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  // 터치 종료 - 스와이프 감지
  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd) {
      // 터치 이동이 없었으면 탭으로 간주
      if (!slid && onItemSelect && itemData) {
        onItemSelect(itemData);
      }
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // 왼쪽으로 스와이프 -> 삭제 버튼 표시
      e.stopPropagation();
      setSlid(true);
    } else if (isRightSwipe && slid) {
      // 오른쪽으로 스와이프 -> 삭제 버튼 숨김
      e.stopPropagation();
      setSlid(false);
    } else if (!slid && Math.abs(distance) < 10) {
      // 스와이프가 아닌 탭인 경우 -> 아이템 선택
      if (onItemSelect && itemData) {
        onItemSelect(itemData);
      }
    }
    
    // 초기화
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  // ItemWrap 클릭 시 처리 (PC용)
  const handleItemWrapClick = (e) => {
    if (slid) {
      // 슬라이드 상태일 때는 슬라이드 해제만
      setSlid(false);
      e.stopPropagation();
    } else {
      // 슬라이드 상태가 아닐 때는 아이템 선택 (PC 클릭)
      e.stopPropagation();
      if (onItemSelect && itemData) {
        onItemSelect(itemData);
      }
    }
  };

  // 삭제 버튼 클릭
  const handleDelete = (e) => {
    e.stopPropagation();
    console.log('삭제 요청:', { idx, itemId: itemData?.id, title });
    onDelete?.(idx);
  };

  return (
    <ItemWrap
      ref={drag}
      $type={type}
      $slid={slid}
      style={{ 
        opacity: isDragging ? 0.5 : 1, 
        cursor: isDragging ? 'grabbing' : 'grab' 
      }}
      onClick={handleItemWrapClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ImgBox>
        {imageUrl && <Img src={imageUrl} alt="item" />}
      </ImgBox>
      <InfoWrap>
        <Title>{title}</Title>
        <Tag>{tags && tags.length > 0 ? tags[0] : '#생활용품'}</Tag>
      </InfoWrap>
      <DeleteArea onClick={handleDeleteAreaClick} />
      <DeleteBtn $show={slid} onClick={handleDelete}>
        <Icons type="delete" size={24} color="#fff" />
      </DeleteBtn>
    </ItemWrap>
  );
}

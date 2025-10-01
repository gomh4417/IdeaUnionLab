
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

  // DeleteArea 클릭 시 슬라이드
  const handleDeleteAreaClick = (e) => {
    e.stopPropagation();
    setSlid(true);
  };
  // ItemWrap 클릭 시 슬라이드 해제
  const handleItemWrapClick = (e) => {
    if (slid) {
      setSlid(false);
      e.stopPropagation();
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

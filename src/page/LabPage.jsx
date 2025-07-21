import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../jsx/Sidebar';
import Header from '../jsx/Header';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { useDrop } from 'react-dnd';
import { useState, useEffect } from 'react';
import Icons from '../jsx/Icons';


import ActionBtn from '../jsx/ActionBtn';
import DropItem from '../jsx/DropItem';
import AdditiveBar from '../jsx/AdditiveBar';


const LayoutWrap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 25px 32px 32px 32px;
  
`;

const ContentWrap = styled.div`
  display: flex;
  gap: 40px;
`;

const DropArea = styled.div`
  width: 840px;
  height: 724px;
  border: 1.5px dashed ${theme.colors.gray[300]};
  border-radius: ${theme.radius.large};
  background: #fbfbfb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 24px;
  transition: border 0.2s;
  position: relative;
  &.hover {
    border: 2px dashed ${theme.colors.gray[500]};
  }
`;


function LabPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialProjects = location.state?.projects || [];

  // 배열 상태 관리
  const [items, setItems] = useState(initialProjects);
  // 드롭 상태 관리
  const [dropped, setDropped] = useState(false);
  const [isItemOver, setIsItemOver] = useState(false);
  const [activatedIdx, setActivatedIdx] = useState(null);
  // AdditiveBar 관련 상태
  const [selectedAdditive, setSelectedAdditive] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  // gif 반복 재생을 위한 key state
  const [gifKey, setGifKey] = useState(Date.now());
  useEffect(() => {
    if (dropped) return; // dropped면 interval 멈춤
    const intervalId = setInterval(() => {
      setGifKey(Date.now());
    }, 7500);
    return () => clearInterval(intervalId);
  }, [dropped]);

  // 삭제 핸들러 (ItemList에 전달)
  const handleDeleteItem = (idx) => {
    setItems(prev => {
      const newArr = prev.filter((_, i) => i !== idx);
      // 현재 drop된 아이템이 삭제되거나, 모두 삭제되면 dropped 해제
      if (activatedIdx === idx || newArr.length === 0) {
        setDropped(false);
        setActivatedIdx(null);
        setSelectedAdditive(null);
        setSliderValue(0);
      }
      return newArr;
    });
  };

  // react-dnd drop 영역
  const [{ isOver }, drop] = useDrop({
    accept: 'ITEM',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: (item, monitor) => {
      if (monitor.isOver({ shallow: true })) setIsItemOver(true);
    },
    // drop 시 드롭된 item의 idx를 활성화
    drop: (item) => {
      setDropped(true);
      setIsItemOver(false);
      if (typeof item.idx === 'number') setActivatedIdx(item.idx);
      // DropArea는 더이상 다시 보이지 않음
      return undefined;
    },
  });
  // isOver 값이 false가 되면(드래그 아웃) 가이드 복구
  useEffect(() => {
    if (!isOver) setIsItemOver(false);
  }, [isOver]);

  return (
    <LayoutWrap>
      <Header type="home" onClick={() => navigate('/')}>Project Name</Header>
      <ContentWrap>
        <Sidebar
          projects={items}
          activatedIdx={activatedIdx}
          setActivatedIdx={setActivatedIdx}
          onDeleteItem={handleDeleteItem}
        />
        {/* 드롭 전에는 DropArea, 드롭 후에는 DropItem + AdditiveBar */}
        {dropped && typeof activatedIdx === 'number' && items[activatedIdx] ? (
          <>
            <DropItem {...items[activatedIdx]} />
            <AdditiveBar
              selectedAdditive={selectedAdditive}
              setSelectedAdditive={setSelectedAdditive}
              sliderValue={sliderValue}
              setSliderValue={setSliderValue}
            />
          </>
        ) : (
          <DropArea
            ref={drop}
            className={isOver ? 'hover' : ''}
            style={{ display: dropped ? 'none' : undefined }}
          >
            {/* 드래그 중이면 upload 아이콘만, 아니면 가이드 */}
            {isItemOver ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Icons type="upload" size={80} color={theme.colors.gray[400]} />
              </div>
            ) : (
              <>
                <img
                  src={`/dragdrop.gif?${gifKey}`}
                  alt="drag guide"
                  style={{ width: 470, height: 220, marginBottom: 12, opacity: 0.8 }}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 500, color: theme.colors.gray[500], marginBottom: 8 }}>아이디어 선택하기</div>
                  <div style={{ fontSize: 16, fontWeight: 400, color: theme.colors.gray[400] }}>리스트에서 아이디어를 드래그하여 이곳에 드롭해 주세요</div>
                </div>
              </>
            )}
          </DropArea>
        )}
      </ContentWrap>
      {dropped && (
        <ActionBtn
          type={selectedAdditive && sliderValue > 0 ? 'default' : 'disabled'}
          iconName="arrow_forward"
          title="실험하기"
          onClick={() => {
            if (typeof activatedIdx === 'number' && items[activatedIdx]) {
              // Additive의 brand color hex값 추출
              let brandColor = '#5755FE';
              if (selectedAdditive) {
                // 예시: Additive type에 따라 색상 매핑 (실제 프로젝트의 색상 매핑에 맞게 수정)
                const colorMap = {
                  creativity: '#5755FE',
                  aesthetics: '#00CD80',
                  usability: '#FD6B03',
                };
                brandColor = colorMap[selectedAdditive] || '#5755FE';
              }
              navigate('/result', { state: { item: items[activatedIdx], additiveType: selectedAdditive, brandColor } });
            }
          }}
          style={{ position: 'absolute', right: 32, bottom: 36 }}
        />
      )}
    </LayoutWrap>
  );
}

export default LabPage

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import ProjectItem from './ProjectItem';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation } from 'react-router-dom';

// 캐러셀 컨테이너 스타일
const CarouselContainer = styled.div`
  width: 100%;
  height: 280px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  position: relative;
`;

// 캐러셀 래퍼 (스크롤 영역)
const CarouselWrapper = styled.div`
  width: 1920px; /* HomePageContainer와 동일한 너비 */
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  
  /* scroll-behavior를 동적으로 제어 */
  scroll-behavior: ${({ $quickSnap }) => $quickSnap ? 'auto' : 'smooth'};
  
  /* scroll-snap 속성 적용 - 동적으로 제어 */
  scroll-snap-type: ${({ $scrollSnapDisabled }) => $scrollSnapDisabled ? 'none' : 'x mandatory'};
  
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }
  
  /* 더 빠른 snap을 위한 CSS 속성 */
  scroll-snap-align: ${({ $scrollSnapDisabled }) => $scrollSnapDisabled ? 'none' : 'center'};
`;

// 캐러셀 트랙 (아이템들을 담는 컨테이너)
const CarouselTrack = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  /* 동적 패딩 계산: 첫 번째와 마지막 아이템이 중앙에 오도록 */
  /* 포커스(확대)된 카드(320px)의 절반(160px)을 기준으로 중앙 정렬 */
  padding-left: calc(50% - 160px);
  padding-right: calc(50% - 160px);
  height: 100%;
  min-width: max-content; /* 콘텐츠 크기에 맞춰 너비 조정 */
`;

// 개별 아이템 래퍼
const ItemWrapper = styled.div`
  scroll-snap-align: center; /* 각 아이템이 중앙에 스냅되도록 */
  scroll-snap-stop: always; /* 모든 아이템에서 반드시 멈추도록 */
  flex-shrink: 0; /* 아이템 크기 고정 */
`;

// 로딩/에러 상태 래퍼
const StateWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 16px;
  color: ${({ $error }) => $error ? '#ff6b6b' : '#999'};
  font-weight: 400;
  width: 100%;
  text-align: center;
`;

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [scrollSnapDisabled, setScrollSnapDisabled] = useState(false);
  const [quickSnap, setQuickSnap] = useState(false);
  const [isDelayedFocusChanging, setIsDelayedFocusChanging] = useState(false);
  const location = useLocation();
  const carouselRef = useRef(null);
  const itemRefs = useRef([]);
  const hasAutoAligned = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  const getClosestIndex = useCallback(() => {
    const container = carouselRef.current;
    if (!container || itemRefs.current.length === 0) return 0;

    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    itemRefs.current.forEach((item, index) => {
      if (!item) return;
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distance = Math.abs(containerCenter - itemCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }, []);

  const scrollToIndexCenter = useCallback((index, behavior = 'smooth') => {
    const container = carouselRef.current;
    const targetItem = itemRefs.current[index];
    if (!container || !targetItem) return;

    const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2;
    const containerCenter = container.offsetWidth / 2;
    const scrollLeft = itemCenter - containerCenter;

    container.scrollTo({ left: scrollLeft, behavior });
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!carouselRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = carouselRef.current.scrollLeft;
    setIsDelayedFocusChanging(true);
    setScrollSnapDisabled(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const container = carouselRef.current;
    if (!container || !isDraggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    container.scrollLeft = dragStartScrollLeftRef.current - dx;
  }, []);

  const endDragAndSnap = useCallback(() => {
    if (!carouselRef.current) return;
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setScrollSnapDisabled(false);

    const closestIndex = getClosestIndex();
    setFocusedIndex(closestIndex);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToIndexCenter(closestIndex, 'smooth');
        setTimeout(() => {
          setIsDelayedFocusChanging(false);
        }, 250);
      });
    });
  }, [getClosestIndex, scrollToIndexCenter]);

  const handleMouseUp = useCallback(() => {
    endDragAndSnap();
  }, [endDragAndSnap]);

  const handleMouseLeave = useCallback(() => {
    endDragAndSnap();
  }, [endDragAndSnap]);

  const handleTouchStart = useCallback((e) => {
    if (!carouselRef.current) return;
    const t = e.touches?.[0];
    if (!t) return;
    isDraggingRef.current = true;
    dragStartXRef.current = t.clientX;
    dragStartScrollLeftRef.current = carouselRef.current.scrollLeft;
    setIsDelayedFocusChanging(true);
    setScrollSnapDisabled(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    const container = carouselRef.current;
    if (!container || !isDraggingRef.current) return;
    const t = e.touches?.[0];
    if (!t) return;
    const dx = t.clientX - dragStartXRef.current;
    container.scrollLeft = dragStartScrollLeftRef.current - dx;
  }, []);

  const handleTouchEnd = useCallback(() => {
    endDragAndSnap();
  }, [endDragAndSnap]);

  // Firestore에서 프로젝트 실시간 로드
  const subscribeToProjects = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'projects'), 
        (snapshot) => {
          const data = snapshot.docs.map((doc) => {
            const docData = doc.data();
            return { 
              id: doc.id, 
              title: docData.title || docData.name || `프로젝트 ${doc.id}`,
              name: docData.name || docData.title || `프로젝트 ${doc.id}`,
              description: docData.description || '설명 없음',
              createdAt: docData.createdAt,
              updatedAt: docData.updatedAt,
              ...docData 
            };
          });
          
          // 날짜순 정렬 (최신순)
          const sortedData = data.sort((a, b) => {
            const dateA = a.updatedAt || a.createdAt;
            const dateB = b.updatedAt || b.createdAt;
            
            if (dateA?.seconds && dateB?.seconds) {
              return dateB.seconds - dateA.seconds;
            }
            
            const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA || 0).getTime();
            const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB || 0).getTime();
            
            return timeB - timeA;
          });
          
          setProjects(sortedData);
          setLoading(false);
          
          // 첫 번째 아이템으로 포커스 설정
          if (sortedData.length > 0) {
            setFocusedIndex(0);
          }
        }, 
        (error) => {
          console.error('프로젝트 로드 실패:', error);
          setError(error.message);
          setLoading(false);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('로드 실패:', error);
      setError(error.message);
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    
    if (location.pathname === '/') {
      unsubscribe = subscribeToProjects();
    } else {
      setLoading(false);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [location.pathname, subscribeToProjects]);

  // 스크롤 이벤트로 현재 포커스된 아이템 감지
  const handleScroll = useCallback(() => {
    // 프로그램 스냅/초기 정렬 중에는 포커스 추적을 잠깐 멈춤
    if (!carouselRef.current || projects.length === 0 || isDelayedFocusChanging) return;
    const closestIndex = getClosestIndex();
    if (closestIndex !== focusedIndex) setFocusedIndex(closestIndex);
  }, [projects.length, focusedIndex, isDelayedFocusChanging, getClosestIndex]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = carouselRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 초기 로드 시 가장 최근 프로젝트(0번)를 StartButton 아래(가로 중앙)로 정렬
  useEffect(() => {
    if (projects.length === 0) return;
    if (hasAutoAligned.current) return;

    // 첫 렌더에서 focused(확대) 적용 후 위치가 바뀔 수 있어서 2프레임 기다린 뒤 정렬
    setIsDelayedFocusChanging(true);
    setScrollSnapDisabled(true);
    setQuickSnap(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToIndexCenter(0, 'auto');
        setFocusedIndex(0);
        setScrollSnapDisabled(false);
        setQuickSnap(false);
        setIsDelayedFocusChanging(false);
        hasAutoAligned.current = true;
      });
    });
  }, [projects.length, scrollToIndexCenter]);

  // 아이템 클릭 시 해당 아이템을 중앙으로 포커싱
  const handleItemClick = useCallback((index) => {
    setFocusedIndex(index);

    // 포커스 변경(확대) -> 레이아웃 변경 반영 후 중앙 정렬
    setIsDelayedFocusChanging(true);
    setScrollSnapDisabled(true);
    setQuickSnap(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToIndexCenter(index, 'smooth');

        // 스크롤 중간에 handleScroll이 포커스를 다시 바꾸지 않도록 잠깐만 잠금
        setTimeout(() => {
          setScrollSnapDisabled(false);
          setQuickSnap(false);
          setIsDelayedFocusChanging(false);
        }, 350);
      });
    });
  }, [scrollToIndexCenter]);

  if (loading) {
    return (
      <CarouselContainer>
        <StateWrapper>프로젝트를 불러오는 중...</StateWrapper>
      </CarouselContainer>
    );
  }

  if (error) {
    return (
      <CarouselContainer>
        <StateWrapper $error>프로젝트 로드 중 오류 발생: {error}</StateWrapper>
      </CarouselContainer>
    );
  }

  if (projects.length === 0) {
    return (
      <CarouselContainer>
        <StateWrapper>아직 프로젝트가 없습니다. 새로운 실험을 시작해보세요!</StateWrapper>
      </CarouselContainer>
    );
  }

  return (
    <CarouselContainer>
      <CarouselWrapper 
        ref={carouselRef} 
        $scrollSnapDisabled={scrollSnapDisabled}
        $quickSnap={quickSnap}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CarouselTrack>
          {projects.map((project, index) => (
            <ItemWrapper
              key={project.id}
              ref={(el) => (itemRefs.current[index] = el)}
            >
              <ProjectItem
                project={{
                  id: project.id,
                  title: project.title || project.name || '제목 없음',
                  createdAt: project.createdAt,
                  date: project.date,
                }}
                focused={index === focusedIndex}
                animating={false}
                onClick={() => handleItemClick(index)}
              />
            </ItemWrapper>
          ))}
        </CarouselTrack>
      </CarouselWrapper>
    </CarouselContainer>
  );
}

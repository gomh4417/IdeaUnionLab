import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import ProjectItem from './ProjectItem';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation } from 'react-router-dom';

// 캐러셀 컨테이너 스타일
const CarouselContainer = styled.div`
  width: 100%;
  height: 260px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
  position: relative;
`;

// 캐러셀 래퍼 (스크롤 영역)
const CarouselWrapper = styled.div`
  width: 1194px; /* HomePageContainer와 동일한 너비 */
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
  padding-left: 437px; /* 왼쪽 패딩 */
  padding-right: 437px; /* 오른쪽 패딩 */
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
    // 지연된 포커스 변경 중에는 스크롤 이벤트 무시
    if (!carouselRef.current || projects.length === 0 || isDelayedFocusChanging) return;

    const container = carouselRef.current;
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;

    itemRefs.current.forEach((item, index) => {
      if (item) {
        // 아이템의 실제 중앙 위치 계산 (패딩 포함)
        const itemLeft = item.offsetLeft;
        const itemWidth = item.offsetWidth;
        const itemCenter = itemLeft + itemWidth / 2;
        const distance = Math.abs(containerCenter - itemCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });

    if (closestIndex !== focusedIndex) {
      setFocusedIndex(closestIndex);
    }
  }, [projects.length, focusedIndex, isDelayedFocusChanging]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = carouselRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 초기 로드 시 첫 번째 아이템(최신 프로젝트)을 중앙에 배치
  useEffect(() => {
    if (projects.length > 0 && carouselRef.current && itemRefs.current[0]) {
      const container = carouselRef.current;
      const firstItem = itemRefs.current[0];
      
      // 첫 번째 아이템의 중앙 위치 계산
      const itemCenter = firstItem.offsetLeft + firstItem.offsetWidth / 2;
      const containerCenter = container.offsetWidth / 2;
      const scrollPosition = itemCenter - containerCenter;
      
      // 즉시 스크롤 (애니메이션 없이)
      container.scrollTo({
        left: scrollPosition,
        behavior: 'auto'
      });
    }
  }, [projects.length]); // projects 로드 완료 후 실행

  // 아이템 클릭 시 해당 아이템으로 스크롤 (지연된 포커스 변경)
  const handleItemClick = useCallback((index) => {
    const targetItem = itemRefs.current[index];
    if (targetItem && carouselRef.current) {
      const container = carouselRef.current;
      
      // 지연된 포커스 변경 시작
      setIsDelayedFocusChanging(true);
      
      // scroll-snap 일시적으로 비활성화
      setScrollSnapDisabled(true);
      setQuickSnap(false);
      
      // 더 정확한 중앙 위치 계산
      const containerRect = container.getBoundingClientRect();
      const itemRect = targetItem.getBoundingClientRect();
      
      // 컨테이너의 중앙점
      const containerCenter = containerRect.width / 2;
      
      // 아이템의 현재 위치에서 컨테이너 중앙까지의 거리
      const itemCurrentCenter = itemRect.left - containerRect.left + itemRect.width / 2;
      const distanceToCenter = itemCurrentCenter - containerCenter;
      
      // 현재 스크롤 위치에서 조정
      const targetScrollPosition = container.scrollLeft + distanceToCenter;
      
      // 부드러운 스크롤 애니메이션
      container.scrollTo({
        left: targetScrollPosition,
        behavior: 'smooth'
      });
      
      // 0.5초 후에 포커스 변경 (크기 변화 지연)
      setTimeout(() => {
        setFocusedIndex(index);
        setIsDelayedFocusChanging(false); // 지연된 포커스 변경 완료
      }, 200);
      
      // 짧은 시간 후 scroll-snap 다시 활성화하여 빠른 최종 조정
      setTimeout(() => {
        setScrollSnapDisabled(false);
        setQuickSnap(true); // 빠른 snap 활성화
        
        // 최종 정확한 위치로 즉시 조정
        setTimeout(() => {
          const finalItemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2;
          const finalContainerCenter = container.offsetWidth / 2;
          const finalScrollPosition = finalItemCenter - finalContainerCenter;
          
          container.scrollTo({
            left: finalScrollPosition,
            behavior: 'auto' // 즉시 이동
          });
          
          // 원래 상태로 복원
          setTimeout(() => {
            setQuickSnap(false);
          }, 100);
        }, 50);
      }, 300); // 더 빠른 snap 활성화
    }
  }, []);

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

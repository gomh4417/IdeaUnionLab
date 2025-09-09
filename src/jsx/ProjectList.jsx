import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import ProjectItem from './ProjectItem';
import { motion, useAnimation } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation } from 'react-router-dom';

const CarouselWrapper = styled.div`
  width: 100%;
  height: 260px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  margin-top: 40px;
  position: relative;
  padding-left: 80px; /* 왼쪽 여백 추가 */
`;

const CarouselTrack = styled(motion.div)`
  display: flex;
  flex-direction: row;
  gap: 32px;
  align-items: center;
`;

const EmptyStateWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 16px;
  color: #999;
  font-weight: 400;
  width: 100%;
  text-align: center;
`;

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusIdx, setFocusIdx] = useState(0); // 첫 번째 아이템 초기 포커스
  const controls = useAnimation();
  const location = useLocation();
  const trackRef = useRef(null);

  const ITEM_WIDTH = 228;
  const ITEM_GAP = 32;
  const TOTAL_ITEM_WIDTH = ITEM_WIDTH + ITEM_GAP;
  const FOCUS_SCALE = 1.05;

  // Firestore에서 프로젝트 실시간 로드
  const subscribeToProjects = () => {
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
          
          // 날짜순 정렬 (최신순 - 새로운 프로젝트가 맨 앞에)
          const sortedData = data.sort((a, b) => {
            const dateA = a.updatedAt || a.createdAt;
            const dateB = b.updatedAt || b.createdAt;
            
            // Firestore Timestamp 객체인 경우
            if (dateA?.seconds && dateB?.seconds) {
              return dateB.seconds - dateA.seconds;
            }
            
            // Date 객체인 경우
            const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA || 0).getTime();
            const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB || 0).getTime();
            
            return timeB - timeA;
          });
          
          console.log('최종 변환된 프로젝트들:', sortedData);
          setProjects(sortedData);
          setLoading(false);
          
          if (focusIdx >= data.length && data.length > 0) {
            setFocusIdx(0);
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
  };

  useEffect(() => {
    let unsubscribe = null;
    
    // HomePage에서만 프로젝트를 실시간 로드
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
  }, [location.pathname]);

  // 중앙 offset 계산
  const calculateOffset = (index) => {
    const container = document.querySelector('.kiWIK'); // HomePage 컨테이너
    const containerWidth = container?.offsetWidth || 1194;
    const scaledWidth = ITEM_WIDTH * FOCUS_SCALE;
    const focusedItemPosition = index * TOTAL_ITEM_WIDTH + scaledWidth / 2;
    return containerWidth / 2 - focusedItemPosition;
  };

  // 첫 로드 시 위치 즉시 설정
  useEffect(() => {
    if (projects.length > 0) {
      const initialOffset = calculateOffset(0); // 첫 번째 아이템 기준
      controls.set({ x: initialOffset }); // 애니메이션 없이 즉시 적용
    }
  }, [projects.length]);

  // focusIdx 변경 시 애니메이션 적용
  useEffect(() => {
    if (projects.length > 0) {
      const offset = calculateOffset(focusIdx);
      controls.start({
        x: offset,
        transition: { type: 'spring', stiffness: 500, damping: 35, duration: 0.4 },
      });
    }
  }, [focusIdx]);

  // 아이템 클릭 시 포커스 이동
  const handleItemClick = (clickedIdx) => {
    if (clickedIdx !== focusIdx) {
      setFocusIdx(clickedIdx);
    }
  };

  return (
    <CarouselWrapper>
      {loading ? (
        <EmptyStateWrapper>프로젝트를 불러오는 중...</EmptyStateWrapper>
      ) : error ? (
        <EmptyStateWrapper style={{ color: '#ff6b6b' }}>
          프로젝트 로드 중 오류 발생: {error}
        </EmptyStateWrapper>
      ) : projects.length === 0 ? (
        <EmptyStateWrapper>아직 프로젝트가 없습니다. 새로운 실험을 시작해보세요!</EmptyStateWrapper>
      ) : (
        <CarouselTrack ref={trackRef} animate={controls}>
          {projects.map((item, idx) => {
            const isFocused = idx === focusIdx;
            return (
              <motion.div
                key={item.id}
                style={{
                  transformOrigin: 'center center', // 포커스 시 중앙 기준
                  scale: isFocused ? FOCUS_SCALE : 1,
                  transition: 'scale 0.3s ease',
                }}
              >
                <ProjectItem
                  project={{
                    id: item.id,
                    title: item.title || item.name || '제목 없음',
                    date: new Date(
                      item.createdAt?.seconds
                        ? item.createdAt.seconds * 1000
                        : item.createdAt || Date.now()
                    ).toLocaleDateString('ko-KR'),
                  }}
                  focused={isFocused}
                  animating={false}
                  onClick={() => handleItemClick(idx)}
                />
              </motion.div>
            );
          })}
        </CarouselTrack>
      )}
    </CarouselWrapper>
  );
}

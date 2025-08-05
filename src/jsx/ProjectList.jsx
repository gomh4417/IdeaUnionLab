import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import ProjectItem from './ProjectItem';
import { motion, useAnimation } from 'framer-motion';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
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
  const [focusIdx, setFocusIdx] = useState(0); // ✅ 첫 번째 아이템 초기 포커스
  const controls = useAnimation();
  const location = useLocation();
  const trackRef = useRef(null);

  const ITEM_WIDTH = 228;
  const ITEM_GAP = 32;
  const TOTAL_ITEM_WIDTH = ITEM_WIDTH + ITEM_GAP;
  const FOCUS_SCALE = 1.05;

  // ✅ Firestore에서 프로젝트 실시간 로드 (onSnapshot 사용)
  const subscribeToProjects = () => {
    try {
      const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProjects(data);
        if (focusIdx >= data.length && data.length > 0) {
          setFocusIdx(0); // 포커스 인덱스 조정
        }
      }, (error) => {
        console.error('프로젝트 실시간 로드 실패:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('프로젝트 구독 실패:', error);
      return null;
    }
  };

  useEffect(() => {
    let unsubscribe = null;
    
    // HomePage에서만 프로젝트를 실시간 로드하도록 제한
    if (location.pathname === '/') {
      unsubscribe = subscribeToProjects();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [location.pathname]);

  // ✅ 중앙 offset 계산
  const calculateOffset = (index) => {
    const container = document.querySelector('.kiWIK'); // HomePage 컨테이너
    const containerWidth = container?.offsetWidth || 1194;
    const scaledWidth = ITEM_WIDTH * FOCUS_SCALE;
    const focusedItemPosition = index * TOTAL_ITEM_WIDTH + scaledWidth / 2;
    return containerWidth / 2 - focusedItemPosition;
  };

  // ✅ 첫 로드 시 위치 즉시 설정 (애니메이션 없이)
  useEffect(() => {
    if (projects.length > 0) {
      const initialOffset = calculateOffset(0); // 첫 번째 아이템 기준
      controls.set({ x: initialOffset }); // 애니메이션 없이 즉시 적용
    }
  }, [projects.length]);

  // ✅ focusIdx 변경 시 애니메이션 적용
  useEffect(() => {
    if (projects.length > 0) {
      const offset = calculateOffset(focusIdx);
      controls.start({
        x: offset,
        transition: { type: 'spring', stiffness: 500, damping: 35, duration: 0.4 },
      });
    }
  }, [focusIdx]);

  // ✅ 아이템 클릭 시 포커스 이동
  const handleItemClick = (clickedIdx) => {
    if (clickedIdx !== focusIdx) {
      setFocusIdx(clickedIdx);
    }
  };

  return (
    <CarouselWrapper>
      {projects.length === 0 ? (
        <EmptyStateWrapper>아직 프로젝트가 없습니다. 새로운 실험을 시작해보세요!</EmptyStateWrapper>
      ) : (
        <CarouselTrack ref={trackRef} animate={controls}>
          {projects.map((item, idx) => {
            const isFocused = idx === focusIdx;
            return (
              <motion.div
                key={item.id}
                style={{
                  transformOrigin: 'center center', // ✅ 포커스 시 중앙 기준
                  scale: isFocused ? FOCUS_SCALE : 1,
                  transition: 'scale 0.3s ease',
                }}
              >
                <ProjectItem
                  project={{
                    id: item.id,
                    title: item.title,
                    date: new Date(
                      item.createdAt?.seconds
                        ? item.createdAt.seconds * 1000
                        : item.createdAt
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

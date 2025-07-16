
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import ProjectItem from './ProjectItem';
import { motion } from 'framer-motion';

const dummyProjects = [
    { title: 'GUI요소디자인 스케치', date: '2025.06.09.' },
    { title: 'UX 리서치 결과', date: '2025.06.10.' },
    { title: '모바일 앱 프로토타입', date: '2025.06.11.' },
    { title: '웹사이트 리뉴얼', date: '2025.06.12.' },
    { title: '브랜드 아이덴티티', date: '2025.06.13.' },
    { title: '사용자 피드백 분석', date: '2025.06.14.' },
    { title: '최종 디자인 발표', date: '2025.06.15.' },
];

const VISIBLE_COUNT = 5;
const CENTER_INDEX = 2; // 0-based, 3rd item

const CarouselWrapper = styled.div`
  width: 100%;
  height: 260px;
  overflow-x: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  margin-top: 40px;
`;

const CarouselTrack = styled(motion.div)`
  display: flex;
  flex-direction: row;
  gap: 32px;
  width: max-content;
  align-items: center;
`;

export default function ProjectList() {
  const [focusIdx, setFocusIdx] = useState(2); // 중앙 포커스 인덱스
  const [isDragging, setIsDragging] = useState(false);
  const [animating, setAnimating] = useState(false);
  const trackRef = useRef(null);

  // 중앙 포커스 기준으로 5개만 보여주기
  const start = Math.max(0, focusIdx - 2);
  const end = Math.min(dummyProjects.length, start + VISIBLE_COUNT);
  const visibleItems = dummyProjects.slice(start, end);

  // 트랙 이동 계산 (중앙 아이템이 항상 가운데 오도록)
  const ITEM_WIDTH = 228 + 32; // 기본 width + gap
  let offset = 0;
  if (focusIdx >= 2) {
    offset = (focusIdx - 2) * ITEM_WIDTH;
  }

  // 드래그/스와이프 핸들러 (framer-motion)
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    setAnimating(true);
    if (info.offset.x < -50 && focusIdx < dummyProjects.length - 1) {
      setFocusIdx(focusIdx + 1);
    } else if (info.offset.x > 50 && focusIdx > 0) {
      setFocusIdx(focusIdx - 1);
    }
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    <CarouselWrapper>
      <CarouselTrack
        ref={trackRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          x: 0,
          transform: `translateX(${-offset}px)`
        }}
      >
        {visibleItems.map((item, idx) => {
          const realIdx = start + idx;
          return (
            <ProjectItem
              key={realIdx}
              project={item}
              focused={realIdx === focusIdx && !isDragging && !animating}
              animating={isDragging || animating}
            />
          );
        })}
      </CarouselTrack>
    </CarouselWrapper>
  );
}

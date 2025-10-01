import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import Icons from './Icons';
import HistoryItem from './HistoryItem';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const HistoryContainer = styled.div`
  position: relative;
`;

const HistoryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 105px;
  min-height: 32px;
  border: none;
  border-radius: ${theme.radius.medium};
  padding: 4px 8px;
  background-color: ${({ $activated }) => $activated ? theme.colors.secondary : theme.colors.gray[300]};
  color: ${({ $activated }) => $activated ? theme.colors.primary : theme.colors.gray[600]};
  font-size: 12px;
  font-weight: 500;
  line-height: 160%;
  cursor: pointer;
  outline: none;
  font-family: 'Pretendard', sans-serif;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ $activated }) => $activated ? theme.colors.secondary : theme.colors.gray[400]};
  }
`;

const ButtonText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ArrowIcon = styled.div`
  flex-shrink: 0;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid currentColor;
  transform: ${({ $activated }) => $activated ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.2s ease;
  margin-left: 4px;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid ${theme.colors.gray[300]};
  border-radius: ${theme.radius.medium};
  box-shadow: ${theme.shadow};
  padding: 4px;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;

  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

export default function HistoryList({ 
  currentGeneration = 1,
  projectId,
  ideaId,
  additiveType,
  ...props 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // 외부 클릭 감지로 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 실험 목록 로드 (하드코딩 방식)
  const loadExperiments = async () => {
    if (!projectId || !ideaId) return;

    try {
      setLoading(true);
      console.log('🔍 실험 목록 로드 시작 (하드코딩 방식)...');
      
      // 하드코딩 방식: 직접 experiments 컬렉션 조회
      const experimentsRef = collection(db, 'projects', projectId, 'ideas', ideaId, 'experiments');
      const q = query(experimentsRef, orderBy('timestamp_created', 'desc'));
      const querySnapshot = await getDocs(q);

      const experiments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // 완료된 실험만 추가 (하드코딩된 필드명 사용)
        if (data.status === 'completed' && data.dropItem_title) {
          experiments.push({
            id: doc.id,
            ...data
          });
        }
      });

      console.log('✅ 조회된 실험 수:', experiments.length);
      setExperiments(experiments);
    } catch (error) {
      console.error('실험 목록 로드 실패:', error);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isOpen && experiments.length === 0) {
      await loadExperiments();
    }
    setIsOpen(!isOpen);
  };

  const handleHistoryItemClick = async (experiment) => {
    try {
      // 선택된 실험의 결과 페이지로 이동 (하드코딩된 필드명 사용)
      navigate('/result', {
        state: {
          experimentId: experiment.id,
          projectId,
          ideaId,
          originalIdea: {
            id: ideaId,
            title: experiment.dropItem_title || 'Unknown Title',
            imageUrl: experiment.dropItem_imageUrl || null,
            description: experiment.dropItem_description || 'No description',
            type: 'generated',
            additiveType: experiment.experiment_additiveType,
            generation: experiment.experiment_generation || 1
          },
          // 실험 조건 정보 (하드코딩된 필드명)
          additiveType: experiment.experiment_additiveType,
          additiveIntensity: experiment.experiment_additiveIntensity,
          referenceImage: experiment.extra_referenceImageUrl || null,
          visionAnalysis: experiment.extra_visionAnalysis || null,
          // ResultReport용 GPT 응답 복원 (하드코딩된 필드명으로)
          gptResponse: {
            title: experiment.report_gptTitle || '',
            description: experiment.report_gptDescription || '',
            steps: [
              {
                title: experiment.report_step1_title || '',
                content: experiment.report_step1_content || ''
              },
              {
                title: experiment.report_step2_title || '',
                content: experiment.report_step2_content || ''
              },
              {
                title: experiment.report_step3_title || '',
                content: experiment.report_step3_content || ''
              },
              {
                title: experiment.report_step4_title || '',
                content: experiment.report_step4_content || ''
              }
            ].filter(step => step.title || step.content) // 빈 단계 제거
          },
          needsSaving: false // 기존 데이터이므로 저장 불필요
        }
      });
    } catch (error) {
      console.error('히스토리 아이템 클릭 실패:', error);
      alert('선택한 실험 기록을 불러오는 중 오류가 발생했습니다.');
    }
    
    setIsOpen(false);
  };

  return (
    <HistoryContainer ref={containerRef} {...props}>
      <HistoryButton 
        $activated={isOpen}
        onClick={handleToggle}
        disabled={loading}
      >
        <ButtonText>{currentGeneration}차 생성물</ButtonText>
        <ArrowIcon $activated={isOpen} />
      </HistoryButton>

      {isOpen && (
        <DropdownMenu>
          {loading ? (
            <div style={{ 
              padding: '12px', 
              textAlign: 'center', 
              fontSize: '12px', 
              color: theme.colors.gray[500] 
            }}>
              로딩 중...
            </div>
          ) : experiments.length === 0 ? (
            <div style={{ 
              padding: '12px', 
              textAlign: 'center', 
              fontSize: '12px', 
              color: theme.colors.gray[500] 
            }}>
              실험 기록이 없습니다
            </div>
          ) : (
            experiments.map((experiment, index) => (
              <HistoryItem
                key={experiment.id}
                generation={index + 1}
                additiveType={experiment.experiment_additiveType || additiveType} // 하드코딩된 필드명
                onClick={() => handleHistoryItemClick(experiment)}
              />
            ))
          )}
        </DropdownMenu>
      )}
    </HistoryContainer>
  );
}
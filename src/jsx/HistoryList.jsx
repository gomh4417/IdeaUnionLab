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
  width: 124px;
  min-height: 38px;
  border: none;
  border-radius: ${theme.radius.medium};
  padding: 4px 14px;
  background-color: ${({ $activated }) => $activated ? theme.colors.secondary : theme.colors.gray[300]};
  color: ${({ $activated }) => $activated ? theme.colors.primary : theme.colors.gray[600]};
  font-size: 16px;
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

  // 실험 목록 로드 - 원재료 아이디어의 experiments에서 모두 조회
  const loadExperiments = async () => {
    if (!projectId || !ideaId) return;

    try {
      setLoading(true);
      console.log('🔍 실험 목록 로드 시작:', { projectId, ideaId });
      
      // 현재 아이디어 정보 가져오기
      const { doc: firestoreDoc, getDoc, collection: firestoreCollection, getDocs } = await import('firebase/firestore');
      const currentIdeaRef = firestoreDoc(db, 'projects', projectId, 'ideas', ideaId);
      const currentIdeaDoc = await getDoc(currentIdeaRef);
      
      if (!currentIdeaDoc.exists()) {
        console.error('❌ 현재 아이디어를 찾을 수 없음:', ideaId);
        return;
      }
      
      const currentIdeaData = currentIdeaDoc.data();
      const currentIdeaType = currentIdeaData.type || 'original';
      
      console.log('📦 현재 아이디어:', {
        id: ideaId,
        type: currentIdeaType,
        generation: currentIdeaData.generation,
        sourceIdeaId: currentIdeaData.sourceIdeaId
      });
      
      // 🔥 현재 아이디어의 계보(lineage) 추적
      // 현재 아이디어부터 역순으로 원재료까지 모든 아이디어 ID를 수집
      const lineageIdeaIds = [ideaId];
      let rootIdeaId = ideaId;
      
      if (currentIdeaType === 'generated' && currentIdeaData.sourceIdeaId) {
        let tempId = currentIdeaData.sourceIdeaId;
        let iterationLimit = 10;
        
        while (iterationLimit > 0) {
          lineageIdeaIds.push(tempId); // 계보에 추가
          
          const tempRef = firestoreDoc(db, 'projects', projectId, 'ideas', tempId);
          const tempDoc = await getDoc(tempRef);
          
          if (!tempDoc.exists()) {
            console.warn('⚠️ 원재료 추적 중 문서를 찾을 수 없음:', tempId);
            break;
          }
          
          const tempData = tempDoc.data();
          
          // 원재료를 찾았거나, sourceIdeaId가 없으면 중단
          if (!tempData.type || tempData.type === 'original' || !tempData.sourceIdeaId) {
            rootIdeaId = tempId;
            console.log('✅ 원재료 아이디어 발견:', rootIdeaId);
            break;
          }
          
          tempId = tempData.sourceIdeaId;
          iterationLimit--;
        }
      }
      
      console.log('📍 현재 아이디어의 계보(lineage):', lineageIdeaIds);
      console.log('📍 실험을 조회할 원재료 아이디어 ID:', rootIdeaId);
      console.log('📍 현재 보고 있는 아이디어 ID:', ideaId);
      console.log('📍 현재 아이디어 generation:', currentIdeaData.generation);
      
      // 🔥 원재료 아이디어의 모든 experiments 조회
      const experimentsRef = firestoreCollection(db, 'projects', projectId, 'ideas', rootIdeaId, 'experiments');
      const experimentsSnapshot = await getDocs(experimentsRef);
      
      console.log('📊 원재료에서 조회된 전체 실험 수:', experimentsSnapshot.size);
      
      const experimentsData = [];
      experimentsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        const isInLineage = lineageIdeaIds.includes(data.resultIdeaId);
        
        console.log(`🔍 실험 검사 중 [${doc.id}]:`, {
          generation: data.generation,
          status: data.status,
          resultIdeaId: data.resultIdeaId,
          계보포함여부: isInLineage,
          '현재아이디어와일치': data.resultIdeaId === ideaId
        });
        
        // 완료된 실험만 포함
        if (data.status === 'completed') {
          // 🔥 중요: 현재 아이디어의 계보에 속한 실험만 필터링
          // 실험의 resultIdeaId(생성된 결과물)가 계보에 포함되어 있는지 확인
          if (isInLineage) {
            experimentsData.push({
              id: doc.id,
              ...data
            });
            console.log(`✅ ${data.generation}차 실험 포함 - ID: ${doc.id}, 결과물: ${data.resultIdeaId}`);
          } else {
            console.log(`⏭️ ${data.generation}차 실험 제외 - ID: ${doc.id}, 결과물: ${data.resultIdeaId}`);
          }
        } else {
          console.log(`⚠️ ${data.generation}차 실험 제외 (미완료) - ID: ${doc.id}, status: ${data.status}`);
        }
      });
      
      // generation 순으로 정렬 (오름차순: 1차→2차→3차)
      experimentsData.sort((a, b) => (a.generation || 0) - (b.generation || 0));

      console.log('✅ 총 조회된 실험 수 (계보 필터링 후):', experimentsData.length);
      
      setExperiments(experimentsData);
    } catch (error) {
      console.error('❌ 실험 목록 로드 실패:', error);
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
      console.log('📌 선택된 실험:', experiment);
      
      // 선택된 실험의 resultIdeaId로 생성물 아이디어 찾기
      const resultIdeaId = experiment.resultIdeaId;
      
      if (!resultIdeaId) {
        console.error('❌ resultIdeaId가 없습니다');
        return;
      }
      
      // 결과 아이디어 문서 가져오기
      const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
      const resultIdeaRef = firestoreDoc(db, 'projects', projectId, 'ideas', resultIdeaId);
      const resultIdeaDoc = await getDoc(resultIdeaRef);
      
      if (!resultIdeaDoc.exists()) {
        console.error('❌ 결과 아이디어를 찾을 수 없음:', resultIdeaId);
        return;
      }
      
      const resultIdeaData = resultIdeaDoc.data();
      console.log('🎯 결과 아이디어 데이터:', resultIdeaData);
      
      // Step 3 데이터 파싱
      let step3Data = {};
      try {
        step3Data = JSON.parse(experiment.current_step3_data || '{}');
      } catch (e) {
        console.warn('⚠️ step3 데이터 파싱 실패:', e);
      }
      
      // 🖼️ 실험 결과 이미지 사용 (current_imageUrl = 생성된 결과물 이미지)
      // 우선순위: current_imageUrl > resultIdeaData.imageUrl > original_imageUrl
      const resultImageUrl = experiment.current_imageUrl || resultIdeaData.imageUrl || experiment.original_imageUrl;
      
      console.log('🖼️ 이미지 선택:', {
        originalImageUrl: experiment.original_imageUrl, // 실험 대상이었던 이미지
        currentImageUrl: experiment.current_imageUrl,   // 실험 결과 이미지 (이걸 사용!)
        resultIdeaImageUrl: resultIdeaData.imageUrl,
        selected: resultImageUrl
      });
      
      // 🎨 첨가제 타입에 따른 브랜드 컬러 설정
      const ADDITIVE_COLORS = {
        creativity: '#5755FE',
        aesthetics: '#00CD80',
        usability: '#FD6B03'
      };
      const additiveTypeFromData = experiment.current_additiveType || resultIdeaData.additiveType || 'creativity';
      const brandColor = ADDITIVE_COLORS[additiveTypeFromData] || '#5755FE';
      
      console.log('브랜드 컬러 설정:', { additiveType: additiveTypeFromData, brandColor });
      
      const experimentIdentifier = experiment.experimentId || experiment.id || '';

      const baseIdea = {
        id: experiment.sourceIdeaId || experiment.rootIdeaId || '',
        title: experiment.original_title || resultIdeaData.sourceTitle || 'Unknown Title',
        description: experiment.original_description || resultIdeaData.sourceDescription || 'No description',
        imageUrl: experiment.original_imageUrl || '',
        type: experiment.original_type || 'original',
        additiveType: experiment.prev_additiveType || additiveTypeFromData,
        generation:
          typeof experiment.original_generation === 'number'
            ? experiment.original_generation
            : Math.max((resultIdeaData.sourceGeneration || (experiment.generation || 1)) - 1, 0),
        sourceIdeaId: experiment.sourceIdeaId || null,
        sourceExperimentId: experiment.prev_experimentId || null,
        isHistoryView: true
      };

      const historyResultIdea = {
        id: resultIdeaId,
        title: experiment.current_title || resultIdeaData.title || 'Unknown Title',
        description: experiment.current_description || resultIdeaData.description || 'No description',
        imageUrl: resultImageUrl,
        type: 'generated',
        additiveType: additiveTypeFromData,
        generation: experiment.generation || resultIdeaData.generation || 1, // 🔥 실험의 generation 우선 사용
        sourceIdeaId: experiment.sourceIdeaId || null,
        sourceExperimentId: experimentIdentifier || null,
        dalleGenerated: !!resultIdeaData.dalleGenerated,
        dalleError: resultIdeaData.dalleError || null,
        isHistoryView: true
      };

      const reconstructedResponse = {
        title: experiment.current_title || '',
        description: experiment.current_description || '',
        steps: [
          {
            title: experiment.current_step1_title || '',
            description: experiment.current_step1_description || ''
          },
          {
            title: experiment.current_step2_title || '',
            description: experiment.current_step2_description || ''
          },
          {
            title: experiment.current_step3_title || '',
            ...step3Data
          },
          {
            title: experiment.current_step4_title || '',
            description: experiment.current_step4_description || ''
          }
        ].filter(step => step.title || step.description)
      };

      // ResultPage로 이동 (과거 기록 보기 모드)
      navigate('/result', {
        state: {
          experimentId: experimentIdentifier,
          projectId,
          ideaId: historyResultIdea.id,
          originalIdea: baseIdea,
          resultIdea: historyResultIdea,
          additiveType: additiveTypeFromData,
          additiveIntensity: experiment.current_additiveIntensity || 0,
          referenceImage: experiment.current_referenceImageUrl || null,
          visionAnalysis: experiment.current_visionAnalysis || null,
          gptResponse: reconstructedResponse,
          brandColor,
          sourceImageUrl: baseIdea.imageUrl,
          needsSaving: false
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
              fontSize: '14px', 
              color: theme.colors.gray[500] 
            }}>
              로딩 중...
            </div>
          ) : experiments.length === 0 ? (
            <div style={{ 
              padding: '12px', 
              textAlign: 'center', 
              fontSize: '14px', 
              color: theme.colors.gray[500] 
            }}>
              실험 기록이 없습니다
            </div>
          ) : (
            experiments.map((experiment) => (
              <HistoryItem
                key={experiment.id}
                generation={experiment.generation || 1} // 실험의 generation 사용
                additiveType={experiment.current_additiveType || additiveType}
                onClick={() => handleHistoryItemClick(experiment)}
              />
            ))
          )}
        </DropdownMenu>
      )}
    </HistoryContainer>
  );
}
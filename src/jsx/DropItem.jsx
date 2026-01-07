import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HistoryBtn from './HistoryBtn';
import HistoryList from './HistoryList';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ICONS = {
  creativity: '/creativity.svg',
  aesthetics: '/aesthetics.svg',
  usability: '/usability.svg',
};

const BRAND_COLORS = {
  creativity: (theme) => theme.colors.brand[3],
  aesthetics: (theme) => theme.colors.brand[1],
  usability: (theme) => theme.colors.brand[2],
};

const Container = styled.div`
  width: 1120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: ${({ $isresult }) => $isresult ? '0' : '24px'};
  padding-left: ${({ $isresult }) => $isresult ? '-12px' : '0'};
`;

const ChipRow = styled.div`
  width: 100%;
  display: flex;
  align-items: start;
  gap: 12px;
  margin-bottom: 4px;
  margin-top: 4px;
`;

const ChipRowSpaceBetween = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  margin-top: 8px;
`;

const ChipGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Chip = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  background: ${({ $brandcolor }) => $brandcolor ? `${$brandcolor}1A` : '#F6F6FB'};
  border-radius: ${({ theme }) => theme.radius.medium};
  padding: 4px 14px 4px 6px;
  height: 38px;
  margin-bottom: 8px;
`;

const ChipIcon = styled.img`
  width: 38px;
  height: 38px;
`;

const ChipText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $brandcolor, theme }) => $brandcolor || theme.colors.gray[900]};
  line-height: 160%;
`;

const ChipLabel = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ $brandcolor }) => $brandcolor || '#cccccc'};
  line-height: 32px;
  margin-bottom: 8px;
`;

const ImgContainer = styled.div`
  width: 1120px;
  height: 720px;
  border-radius: ${({ theme }) => theme.radius.medium};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  overflow: hidden;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: #fff;
  text-align: center;
  
  .main-text {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 12px;
  }
  
  .sub-text-container {
    position: relative;
    height: 24px;
    width: 400px;
    overflow: hidden;
  }
  
  .sub-text {
    font-size: 16px;
    font-weight: 300;
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    white-space: nowrap;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 8px;
  align-self: flex-start;
`;

const SkeletonTitle = styled.div`
  width: 180px;
  height: 28px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.small};
  margin-bottom: 6px;
  align-self: flex-start;
  animation: shimmer 1.5s infinite;
  
  @keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
`;

const Content = styled.div`
  font-size: 16px;
  font-weight: 300;
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 24px;
  text-align: justify;
  width: 100%;
  max-height: 160px;
  overflow-y: scroll;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const SkeletonContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SkeletonLine = styled.div`
  width: ${({ $width }) => $width || '100%'};
  height: ${({ $height }) => $height || '20px'};
  background: ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.small};
  animation: shimmer 1.5s infinite;
  
  @keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
`;

export default function DropItem({ 
  title, 
  imageUrl, 
  content, 
  type, 
  additiveType, 
  generation = 1, 
  pageType = 'lab',
  loading = false,
  loadingColor = null,
  loadingExit = false,
  // 히스토리 버튼을 위한 데이터
  projectId = null,
  ideaId = null,
  sourceExperimentId = null,
  // HistoryList 표시 여부 (과거 기록 보기 모드인지)
  showHistoryList = false
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // 로딩 상태를 지연시키기 위한 내부 상태
  const [displayLoading, setDisplayLoading] = useState(loading);

  // 히스토리 버튼 클릭 핸들러
  const handleHistoryClick = async () => {
    
    if (!projectId || !ideaId || !sourceExperimentId) {
      alert('히스토리 데이터를 불러올 수 없습니다.');
      return;
    }

    try {
      console.log('📚 히스토리 로드 시작:', { projectId, ideaId, sourceExperimentId });
      
      // 현재 아이디어 문서 가져오기
      const currentIdeaRef = doc(db, 'projects', projectId, 'ideas', ideaId);
      const currentIdeaDoc = await getDoc(currentIdeaRef);
      
      if (!currentIdeaDoc.exists()) {
        alert('아이디어를 찾을 수 없습니다.');
        return;
      }
      
      const ideaData = currentIdeaDoc.data();
      console.log('📦 현재 아이디어 데이터:', {
        id: ideaId,
        generation: ideaData.generation,
        type: ideaData.type,
        title: ideaData.title,
        sourceIdeaId: ideaData.sourceIdeaId,
        sourceExperimentId: ideaData.sourceExperimentId,
        'prop으로받은sourceExperimentId': sourceExperimentId,
        '일치여부': ideaData.sourceExperimentId === sourceExperimentId
      });
      
      // 🔥 원재료 아이디어 ID 찾기
      let rootIdeaId = ideaId;
      
      if (ideaData.type === 'generated' && ideaData.sourceIdeaId) {
        // 생성물인 경우 sourceIdeaId를 거슬러 올라가 원재료 찾기
        let tempId = ideaData.sourceIdeaId;
        let iterationLimit = 10;
        
        while (iterationLimit > 0) {
          const tempRef = doc(db, 'projects', projectId, 'ideas', tempId);
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
      
      console.log('🔍 실험을 조회할 원재료 아이디어 ID:', rootIdeaId);
      
      // 🔥 현재 아이디어의 sourceExperimentId 사용 (props보다 Firebase 문서 데이터 우선!)
      const actualSourceExperimentId = ideaData.sourceExperimentId || sourceExperimentId;
      
      if (!actualSourceExperimentId) {
        alert('실험 ID를 찾을 수 없습니다.');
        return;
      }
      
      console.log('🆔 사용할 실험 ID:', {
        'Firebase문서의sourceExperimentId': ideaData.sourceExperimentId,
        'prop으로받은sourceExperimentId': sourceExperimentId,
        '최종사용할ID': actualSourceExperimentId
      });
      
      // 🔥 원재료 아이디어의 experiments 컬렉션에서 실험 문서 가져오기
      const experimentRef = doc(db, 'projects', projectId, 'ideas', rootIdeaId, 'experiments', actualSourceExperimentId);
      const experimentDoc = await getDoc(experimentRef);
      
      if (!experimentDoc.exists()) {
        alert('실험 기록을 찾을 수 없습니다.');
        return;
      }
      
      const expData = experimentDoc.data();
      console.log('📊 실험 데이터 로드 완료:', {
        experimentId: sourceExperimentId,
        generation: expData.generation,
        sourceIdeaId: expData.sourceIdeaId,
        resultIdeaId: expData.resultIdeaId,
        status: expData.status,
        '현재아이디어ID': ideaId,
        'resultIdeaId와일치': expData.resultIdeaId === ideaId
      });
      
      // 🔥 결과 아이디어 문서 가져오기
      const resultIdeaId = expData.resultIdeaId || ideaId;
      console.log(`🎯 결과 아이디어 ID 결정: ${resultIdeaId} (실험의 resultIdeaId: ${expData.resultIdeaId}, 현재 ideaId: ${ideaId})`);
      
      const resultIdeaRef = doc(db, 'projects', projectId, 'ideas', resultIdeaId);
      const resultIdeaDoc = await getDoc(resultIdeaRef);
      
      if (!resultIdeaDoc.exists()) {
        console.error('❌ 결과 아이디어를 찾을 수 없음:', resultIdeaId);
        alert('결과 아이디어를 찾을 수 없습니다.');
        return;
      }
      
      const resultIdeaData = resultIdeaDoc.data();
      console.log('🎯 결과 아이디어 데이터:', {
        id: resultIdeaId,
        generation: resultIdeaData.generation,
        type: resultIdeaData.type,
        title: resultIdeaData.title,
        sourceIdeaId: resultIdeaData.sourceIdeaId,
        sourceExperimentId: resultIdeaData.sourceExperimentId
      });
      
      console.log('✅ 최종 ideaId 값 확인:', {
        'props로받은ideaId': ideaId,
        'resultIdeaId(사용할값)': resultIdeaId,
        '타입확인': typeof resultIdeaId
      });
      
      // Step 3 데이터 파싱
      let step3Data = {};
      try {
        step3Data = JSON.parse(expData.current_step3_data || '{}');
      } catch (e) {
        console.warn('Step 3 데이터 파싱 실패:', e);
      }
      
      // 🎨 첨가제 타입에 따른 브랜드 컬러 설정
      const ADDITIVE_COLORS = {
        creativity: '#5755FE',
        aesthetics: '#00CD80',
        usability: '#FD6B03'
      };
      const additiveTypeFromData = expData.current_additiveType || ideaData.additiveType || 'creativity';
      const brandColor = ADDITIVE_COLORS[additiveTypeFromData] || '#5755FE';
      
      console.log('🎨 브랜드 컬러 설정:', { additiveType: additiveTypeFromData, brandColor });
      
      // 🖼️ 실험 대상이었던 원본 이미지 URL (ResultReport에 표시용)
      const sourceImageUrl = expData.original_imageUrl || null;
      console.log('🖼️ 실험 대상 이미지 URL (sourceImageUrl):', sourceImageUrl);
      
      // 🖼️ 실험 결과 이미지 URL (DropItem에 표시용)
      const resultImageUrl = expData.current_imageUrl || resultIdeaData.imageUrl || expData.original_imageUrl;
      console.log('🖼️ 실험 결과 이미지 URL (resultImageUrl):', resultImageUrl);
      
      // 🔥 실험 대상 아이디어 정보 (originalIdea) - ResultReport 좌측 이미지용
      const originalIdeaForResult = {
        id: expData.sourceIdeaId || ideaId,
        title: expData.original_title || ideaData.title,
        description: expData.original_description || ideaData.description,
        imageUrl: expData.original_imageUrl || ideaData.imageUrl,
        type: 'original',
        additiveType: ideaData.additiveType,
        generation: (expData.original_generation || ideaData.generation || 0),
        sourceIdeaId: ideaData.sourceIdeaId,
        sourceExperimentId: actualSourceExperimentId, // 🔥 actualSourceExperimentId 사용
        isHistoryView: true
      };
      
      // 🔥 실험 결과 아이디어 정보 (resultIdea) - DropItem 표시용
      // ⚠️ 중요: resultIdeaData(실제 Firebase 문서)를 우선 사용!
      // 3차 생성물의 sourceExperimentId가 2차 실험을 가리킬 수 있으므로
      // expData가 아닌 resultIdeaData를 기준으로 해야 올바른 generation이 표시됨
      const resultIdeaForDisplay = {
        id: resultIdeaId,
        title: resultIdeaData.title || expData.current_title,
        description: resultIdeaData.description || expData.current_description,
        imageUrl: resultIdeaData.imageUrl || resultImageUrl, // 🔥 Firebase 문서의 imageUrl 우선!
        type: 'generated',
        additiveType: resultIdeaData.additiveType || additiveTypeFromData,
        generation: resultIdeaData.generation || expData.generation || 1, // 🔥 Firebase 문서의 generation 우선!
        sourceIdeaId: resultIdeaData.sourceIdeaId || expData.sourceIdeaId,
        sourceExperimentId: resultIdeaData.sourceExperimentId || sourceExperimentId,
        dalleGenerated: !!resultIdeaData.dalleGenerated,
        dalleError: resultIdeaData.dalleError || null,
        isHistoryView: true
      };
      
      console.log('🎯 resultIdeaForDisplay 생성:', {
        'Firebase문서generation': resultIdeaData.generation,
        '실험데이터generation': expData.generation,
        '최종generation': resultIdeaForDisplay.generation,
        'Firebase문서imageUrl': resultIdeaData.imageUrl,
        '최종imageUrl': resultIdeaForDisplay.imageUrl
      });
      
      console.log('🎯 ResultPage로 전달할 데이터:');
      console.log('  - originalIdea (실험 대상):', originalIdeaForResult);
      console.log('  - resultIdea (실험 결과, DropItem 표시용):', resultIdeaForDisplay);
      
      // ResultPage로 이동 (과거 기록 보기 모드)
      navigate('/result', {
        state: {
          experimentId: actualSourceExperimentId,
          projectId,
          ideaId: resultIdeaId, // 🔥 결과물 ID (현재 보고 있는 생성물)
          originalIdea: originalIdeaForResult, // 🔥 실험 대상 아이디어 (부모 생성물)
          resultIdea: resultIdeaForDisplay, // 🔥 실험 결과 아이디어 (현재 생성물)
          additiveType: additiveTypeFromData,
          additiveIntensity: expData.current_additiveIntensity || 0,
          referenceImage: expData.current_referenceImageUrl || null,
          visionAnalysis: expData.current_visionAnalysis || null,
          gptResponse: {
            title: expData.current_title || '',
            description: expData.current_description || '',
            steps: [
              {
                title: expData.current_step1_title || '',
                description: expData.current_step1_description || ''
              },
              {
                title: expData.current_step2_title || '',
                description: expData.current_step2_description || ''
              },
              {
                title: expData.current_step3_title || '',
                ...step3Data
              },
              {
                title: expData.current_step4_title || '',
                description: expData.current_step4_description || ''
              }
            ].filter(step => step.title || step.description)
          },
          brandColor,
          sourceImageUrl, // 🔥 ResultReport step1에 표시될 실험 대상 이미지
          needsSaving: false
        }
      });
    } catch (error) {
      console.error('❌ 히스토리 데이터 로드 실패:', error);
      alert('히스토리를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const labTexts = [
    "사용자의 원재료를 분석하고 있어요",
    "원재료에 첨가제를 추가하고 있어요", 
    "실험 결과 리포트를 작성하고 있어요"
  ];
  
  const resultTexts = [
    "결과물을 시각화하고 있어요",
    "이미지 안정화 작업 중이에요",
    "실험실을 정리하고 있어요"
  ];
  
  const subTexts = pageType === 'result' ? resultTexts : labTexts;
  const mainText = pageType === 'result' ? "최종 완성된 이미지를 생성하고 있어요!" : "디자인 실험을 시작했어요!";
  
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  // 로딩 완료 후 1.5초 지연 처리
  useEffect(() => {
    if (loading) {
      // 로딩 시작 시 즉시 표시
      setDisplayLoading(true);
    } else {
      // 로딩 완료 후 1.5초 뒤에 숨김
      const timer = setTimeout(() => {
        setDisplayLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  useEffect(() => {
    if (!displayLoading) return;
    
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % subTexts.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [displayLoading, subTexts.length]);
  
  let brandColor = theme.colors.brand[1];
  if (additiveType) {
    const fn = BRAND_COLORS[additiveType];
    brandColor = fn ? fn(theme) : theme.colors.brand[1];
  }

  // 이미지 URL 검증 및 로깅
  console.log('🎯 DropItem 렌더링 정보:');
  console.log('  - Title:', title);
  console.log('  - Content 길이:', content?.length);
  console.log('  - Type:', type);
  console.log('  - ImageURL:', imageUrl);
  console.log('  - ImageURL 유효성:', !!(imageUrl && typeof imageUrl === 'string' && imageUrl.trim()));
  if (imageUrl) {
    console.log('  - URL Type:', imageUrl.includes('.firebasestorage.app') ? 'firebasestorage.app' : 
                                  imageUrl.includes('firebasestorage.googleapis.com') ? 'googleapis.com' : 'other');
  } else {
    console.warn('⚠️ DropItem에 전달된 imageUrl이 비어있음!');
  }
  console.log('  - AdditiveType:', additiveType);
  console.log('  - Generation:', generation);

  const isResult = type === 'result';
  const isLabPage = pageType === 'lab';
  const isResultPage = pageType === 'result';
  
  return (
    <Container $isresult={isResult}>
      {/* ResultPage: 생성물이고 additiveType이 있고 generation이 1 이상인 경우 Image 위에 chip 표시 */}
      {isResultPage && isResult && additiveType && generation >= 1 && (
        <ChipRowSpaceBetween>
          <ChipGroup>
            <Chip $brandcolor={brandColor}>
              <ChipIcon src={ICONS[additiveType] || ICONS['creativity']} alt="icon" />
              <ChipText $brandcolor={brandColor}>{generation}차 생성물</ChipText>
            </Chip>
            <ChipLabel $brandcolor={brandColor}>
              생성된 아이디어
            </ChipLabel>
          </ChipGroup>
          {/* HistoryList 컴포넌트 (과거 기록 보기 모드에서만 표시) */}
          {showHistoryList && projectId && ideaId && (
            <HistoryList
              currentGeneration={generation}
              projectId={projectId}
              ideaId={ideaId}
              additiveType={additiveType}
            />
          )}
        </ChipRowSpaceBetween>
      )}
      
      {imageUrl ? (
        <ImgContainer>
          <Image src={imageUrl} alt={title} />
          
          {/* 로딩 오버레이 */}
          {displayLoading && (
            <LoadingOverlay
              initial={
                pageType === 'result' 
                  ? { scale: 1, opacity: 1 }  // ResultPage: 즉시 나타남
                  : { scale: 0 }              // LabPage: spring 효과
              }
              animate={
                loadingExit 
                  ? { scale: 0, opacity: 0 }  // Exit 애니메이션
                  : { scale: 1, opacity: 1 }  
              }
              exit={{ scale: 0, opacity: 0 }}
              transition={
                loadingExit 
                  ? { duration: 0.2, ease: "easeInOut" }  // Exit 애니메이션
                  : pageType === 'result'
                    ? { duration: 0 }                     // ResultPage: 즉시
                    : {                                   // LabPage: spring
                        type: 'spring', 
                        stiffness: 50,
                        damping: 5,
                        mass: 0.5
                      }
              }
              style={{ 
                backgroundColor: loadingColor || '#5755FE'
              }}
            >
              <LoadingSpinner />
              <LoadingText>
                <div className="main-text">{mainText}</div>
                <div className="sub-text-container">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTextIndex}
                      className="sub-text"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        duration: 0.5,
                        ease: "easeInOut"
                      }}
                    >
                      {subTexts[currentTextIndex]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </LoadingText>
            </LoadingOverlay>
          )}
        </ImgContainer>
      ) : null}

      {/* LabPage: 생성물이고 additiveType이 있고 generation이 1 이상인 경우 Title 위에 chip 표시 */}
      {isLabPage && isResult && additiveType && generation >= 1 && (
        <ChipRow>
          <Chip $brandcolor={brandColor}>
            <ChipIcon src={ICONS[additiveType] || ICONS['creativity']} alt="icon" />
            <ChipText $brandcolor={brandColor}>{generation}차 생성물</ChipText>
          </Chip>
          {/* 히스토리 버튼 (소스 실험 ID가 있는 경우만) */}
          {sourceExperimentId && (
            <HistoryBtn onClick={handleHistoryClick} />
          )}
        </ChipRow>
      )}
      
      {/* 로딩 중일 때 스켈레톤 UI 표시 */}
      {displayLoading ? (
        <>
          <SkeletonContent>
            <SkeletonLine $width="50%" $height="28px" />
            <SkeletonLine $width="100%" />
            <SkeletonLine $width="100%" />
            <SkeletonLine $width="100%" />
          </SkeletonContent>
        </>
      ) : (
        <>
          <Title>{title}</Title>
          <Content>{content}</Content>
        </>
      )}
    </Container>
  );
}

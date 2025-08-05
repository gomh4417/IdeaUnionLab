import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextIdWithCounter } from '../utils/firebaseCounter';
import { generateImprovedProductWithImage } from '../utils/gptApi';
import Header from '../jsx/Header';
import styled from 'styled-components';
import ResultReport from '../jsx/ResultReport';
import ActionBtn from '../jsx/ActionBtn';

import DropItem from '../jsx/DropItem';

const LayoutWrap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 25px 32px 32px 32px;
`;

const ContentWrap = styled.div`
  display: flex;
  gap: 40px;
`;


function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [improvedIdea, setImprovedIdea] = useState(null); // 개선된 아이디어 정보
  const [loadingImprovedInfo, setLoadingImprovedInfo] = useState(false);
  
  // LabPage에서 넘겨준 상태값들
  const experimentId = location.state?.experimentId;
  const projectId = location.state?.projectId;
  const ideaId = location.state?.ideaId;
  const originalIdea = location.state?.originalIdea;
  const additiveType = location.state?.additiveType;
  const additiveIntensity = location.state?.additiveIntensity;
  const referenceImage = location.state?.referenceImage; // 레퍼런스 이미지
  const brandColor = location.state?.brandColor;
  const gptResponse = location.state?.gptResponse; // GPT API 응답
  const needsSaving = location.state?.needsSaving;

  // 컴포넌트 마운트 시 개선된 제품 정보 및 DALL-E 이미지 생성 (중복 실행 방지)
  useEffect(() => {
    let isMounted = true;
    let hasGenerated = false;
    
    const generateImprovedInfo = async () => {
      if (!gptResponse?.steps || !originalIdea || hasGenerated) return;
      hasGenerated = true;
      
      try {
        if (isMounted) {
          setLoadingImprovedInfo(true);
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('개선된 제품 정보 및 DALL-E 이미지 생성 시작...');
        }
        
        // 통합 함수로 개선된 정보와 DALL-E 이미지를 한번에 생성
        const improvedInfoWithImage = await generateImprovedProductWithImage(
          originalIdea.title,
          originalIdea.description,
          gptResponse.steps,
          additiveType
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log('생성된 개선 정보:', improvedInfoWithImage);
        }
        
        // 개선된 아이디어 정보 설정 (DALL-E 이미지 포함)
        if (isMounted) {
          // DALL-E 이미지 생성 결과에 따른 처리
          if (improvedInfoWithImage.imageGenerationSuccess === false) {
            console.error('DALL-E 이미지 생성 실패 감지');
            console.error('오류 내용:', improvedInfoWithImage.imageGenerationError);
            console.log('원본 이미지로 대체하지 않고 이미지 없는 상태로 처리');
          } else if (improvedInfoWithImage.imageUrl) {
            console.log('DALL-E 이미지 생성 성공, 새로운 이미지 사용');
          }

          setImprovedIdea({
            ...originalIdea,
            title: improvedInfoWithImage.title,
            description: improvedInfoWithImage.description,
            // DALL-E 이미지가 성공적으로 생성되었으면 사용, 실패했으면 원본 이미지 사용
            imageUrl: improvedInfoWithImage.imageUrl || originalIdea.imageUrl,
            isImproved: true, // 개선된 아이디어임을 표시
            dalleGenerated: improvedInfoWithImage.imageGenerationSuccess || false, // DALL-E 이미지 생성 성공 여부
            dalleError: improvedInfoWithImage.imageGenerationError || null, // DALL-E 에러 정보
            originalImagePrompt: improvedInfoWithImage.originalImagePrompt // 원본 프롬프트 저장
          });
        }
        
      } catch (error) {
        console.error('개선된 제품 정보 생성 실패:', error);
        // 실패 시 원본 정보를 기본값으로 사용
        if (isMounted) {
          console.log('⚠️ 전체 생성 프로세스 실패로 기본값 사용');
          setImprovedIdea({
            ...originalIdea,
            title: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 개선된 ${originalIdea.title}`,
            description: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 첨가제를 통해 개선된 제품입니다.`,
            imageUrl: originalIdea.imageUrl, // 실패 시 원본 이미지 사용
            isImproved: true,
            dalleGenerated: false,
            dalleError: error.message // 전체 프로세스 에러
          });
        }
      } finally {
        if (isMounted) {
          setLoadingImprovedInfo(false);
        }
      }
    };

    generateImprovedInfo();
    
    return () => {
      isMounted = false;
    };
  }, [gptResponse, originalIdea, additiveType]);

  // 저장 함수
  const handleSaveExperiment = async () => {
    try {
      setSaving(true);
      
      // 1. 실험 결과 업데이트
      const finalExperimentData = {
        status: 'completed',
        result: {
          title: improvedIdea?.title || gptResponse.title,
          description: improvedIdea?.description || gptResponse.description,
          imageUrl: improvedIdea?.imageUrl || originalIdea.imageUrl, // DALL-E 생성 이미지 우선 사용
          steps: gptResponse.steps,
          // DALL-E 관련 정보 저장
          ...(improvedIdea?.dalleGenerated && {
            dalleGenerated: true,
            originalImagePrompt: improvedIdea.originalImagePrompt
          }),
          // DALL-E 에러 정보 저장 (있는 경우)
          ...(improvedIdea?.dalleError && {
            dalleGenerationFailed: true,
            dalleError: improvedIdea.dalleError
          })
        },
        // 심미성 첨가제인 경우 레퍼런스 이미지 포함
        ...(additiveType === 'aesthetics' && referenceImage && {
          referenceImageUrl: referenceImage
        }),
        completedAt: new Date(),
        updatedAt: new Date()
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('실험 결과 업데이트:', finalExperimentData);
      }
      
      // Firebase에서 실험 문서 업데이트
      const experimentRef = doc(db, "projects", projectId, "ideas", ideaId, "experiments", experimentId);
      await updateDoc(experimentRef, finalExperimentData);
      
      // 2. 생성물 아이디어 추가 (원본과 별도로)
      // 카운터를 사용한 효율적인 생성물 아이디어 ID 생성
      const { id: newIdeaId } = await getNextIdWithCounter(
        `counters/projects/${projectId}/result_ideas`, 
        'result_idea'
      );
      
      if (process.env.NODE_ENV === 'development') {
        console.log('생성될 생성물 아이디어 ID:', newIdeaId);
      }
      
      // 첨가제 타입에 따른 적절한 태그 생성
      let resultTag = "#생성물";
      const additiveTagMap = {
        creativity: "#창의개선",
        aesthetics: "#심미개선", 
        usability: "#사용개선"
      };
      resultTag = additiveTagMap[additiveType] || "#생성물";
      
      // 생성물 아이디어 데이터
      const generatedIdeaData = {
        id: newIdeaId,
        title: improvedIdea?.title || gptResponse.title,
        description: improvedIdea?.description || gptResponse.description,
        imageUrl: improvedIdea?.imageUrl || originalIdea.imageUrl, // DALL-E 생성 이미지 우선 사용
        tags: [resultTag], // 첨가제 타입에 따른 개선 태그
        type: "generated", // 생성된 아이디어임을 표시
        additiveType: additiveType, // 첨가제 타입 저장
        sourceExperimentId: experimentId, // 어떤 실험에서 생성되었는지 추적
        sourceIdeaId: ideaId, // 원본 아이디어 ID 참조
        additiveIntensity: additiveIntensity,
        
        // DALL-E 관련 정보 저장
        ...(improvedIdea?.dalleGenerated && {
          dalleGenerated: true,
          originalImagePrompt: improvedIdea.originalImagePrompt
        }),
        // DALL-E 에러 정보 저장 (있는 경우)
        ...(improvedIdea?.dalleError && {
          dalleGenerationFailed: true,
          dalleError: improvedIdea.dalleError
        }),
        createdAt: new Date(),
      };
      
      // 생성물 아이디어를 새로운 문서로 저장
      await setDoc(doc(db, "projects", projectId, "ideas", newIdeaId), generatedIdeaData);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('생성물 아이디어 저장 완료:', generatedIdeaData);
        console.log('실험 결과 저장 완료');
      }
      
      let successMessage = '';
      
      if (improvedIdea?.dalleGenerated) {
        successMessage = '실험 결과가 성공적으로 저장되었습니다!\nDALL-E 3로 생성된 새로운 제품 이미지와 함께 생성물 아이디어가 추가되었습니다.';
      } else if (improvedIdea?.dalleError) {
        successMessage = '실험 결과가 저장되었습니다.\n DALL-E 이미지 생성에 실패하여 원본 이미지를 사용했습니다.\n생성물 아이디어가 추가되었습니다.';
        console.log('⚠️ DALL-E 생성 실패로 원본 이미지 사용:', improvedIdea.dalleError);
      } else {
        successMessage = '실험 결과가 성공적으로 저장되었습니다!\n생성물 아이디어가 새로 추가되었습니다.';
      }
      
      alert(successMessage);
      
      // LabPage로 돌아가기
      navigate('/lab', { state: { projectId } });
      
    } catch (error) {
      console.error('실험 결과 저장 실패:', error);
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LayoutWrap>
      <Header type="back" onClick={() => navigate('/lab', { state: { projectId } })}>Project Name</Header>
      <ContentWrap>
        {loadingImprovedInfo ? (
          <div style={{ 
            width: '563px', 
            height: '600px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#999',
            fontSize: '16px',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>실험 결과 이미지를 생성하고 있습니다...</div>
            <div style={{ fontSize: '14px', color: '#ccc' }}>
              잠시만 기다려주세요!
            </div>
          </div>
        ) : improvedIdea ? (
          <DropItem
            title={improvedIdea.title}
            imageUrl={improvedIdea.imageUrl}
            content={improvedIdea.description}
            type="result"
            additiveType={additiveType}
            generation={1}
            pageType="result"
          />
        ) : originalIdea && (
          <DropItem
            title={originalIdea.title}
            imageUrl={originalIdea.imageUrl}
            content={originalIdea.description}
            type="result"
            additiveType={additiveType}
            generation={1}
            pageType="result"
          />
        )}
        <ResultReport 
          brandColor={brandColor} 
          experimentResult={gptResponse}
          additiveType={additiveType}
          additiveIntensity={additiveIntensity}
        />
      </ContentWrap>
      
      {/* 저장 버튼 (needsSaving이 true일 때만 표시) */}
      {needsSaving && (
        <ActionBtn
          type={saving ? 'disabled' : 'default'}
          iconName="arrow_forward"
          title={saving ? '저장 중...' : '저장하기'}
          onClick={handleSaveExperiment}
          disabled={saving}
          style={{ position: 'absolute', right: 32, bottom: 36 }}
        />
      )}
    </LayoutWrap>
  );
}

export default ResultPage;

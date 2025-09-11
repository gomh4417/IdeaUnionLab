import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextIdWithCounter } from '../utils/firebaseCounter';
import { generateImprovedProductWithImage } from '../utils/Aiapi';
import { uploadDataUrl } from '../utils/firebaseStorage';
import Header from '../jsx/Header';
import styled from 'styled-components';
import DropItem from '../jsx/DropItem';
import ResultReport from '../jsx/ResultReport';
import ActionBtn from '../jsx/ActionBtn';

// 첨가제별 브랜드 컬러 매핑 (LabPage와 동일)
const ADDITIVE_COLORS = {
  creativity: '#5755FE',  // brand[3]
  aesthetics: '#00CD80',  // brand[1] 
  usability: '#FD6B03'    // brand[2]
};

const LayoutWrap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 25px 32px 32px 32px;
`;

const ContentWrap = styled.div`
  display: flex;
  gap: 40px;
`;

// undefined / 함수 제거용 (Firestore에 안전)
const clean = (obj) => JSON.parse(JSON.stringify(obj || null));

function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [saving, setSaving] = useState(false);
  const [improvedIdea, setImprovedIdea] = useState(null);
  const [loadingImprovedInfo, setLoadingImprovedInfo] = useState(false);
  const [loadingExit, setLoadingExit] = useState(false);

  // LabPage에서 전달된 값
  const experimentId = location.state?.experimentId;
  const projectId = location.state?.projectId;
  const ideaId = location.state?.ideaId;
  const originalIdea = location.state?.originalIdea;
  const additiveType = location.state?.additiveType;
  const additiveIntensity = location.state?.additiveIntensity;
  const referenceImage = location.state?.referenceImage;
  const visionAnalysis = location.state?.visionAnalysis; // Vision API 분석 결과
  const gptResponse = location.state?.gptResponse;
  const needsSaving = location.state?.needsSaving;

  // generation 계산 함수
  const calculateGeneration = (baseIdea) => {
    if (!baseIdea) return 1;
    
    // 원본 아이디어는 0차, 첫 실험 결과는 1차
    if (!baseIdea.type || baseIdea.type === 'original') {
      return 1; // 원본에서 실험한 결과이므로 1차
    }
    
    // 이미 생성물인 경우 현재 generation + 1
    if (baseIdea.type === 'generated') {
      const currentGeneration = baseIdea.generation || 1;
      return currentGeneration + 1;
    }
    
    return 1;
  };

  // 개선 정보 & 이미지 생성
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!gptResponse?.steps || !originalIdea) return;
      try {
        setLoadingImprovedInfo(true);
        
        console.log('🚀 ResultPage: 이미지 생성 프로세스 시작');
        console.log('📋 입력 데이터:');
        console.log('- originalIdea.title:', originalIdea.title);
        console.log('- originalIdea.description:', originalIdea.description);
        console.log('- additiveType:', additiveType);
        console.log('- visionAnalysis 존재:', !!visionAnalysis);
        console.log('- originalIdea.imageUrl 존재:', !!originalIdea.imageUrl);
        console.log('- originalIdea.imageUrl:', originalIdea.imageUrl?.substring(0, 100) + '...');
        
        const improved = await generateImprovedProductWithImage(
          originalIdea.title,
          originalIdea.description,
          gptResponse.steps,
          additiveType,
          visionAnalysis || '', // Vision API 분석 결과 전달
          originalIdea.imageUrl // 원본 이미지 URL 전달
        );

        if (!mounted) return;

        console.log('🎯 ResultPage: 이미지 생성 완료');
        console.log('📊 결과 데이터:');
        console.log('- improved.title:', improved.title);
        console.log('- improved.description:', improved.description);
        console.log('- improved.imageUrl 존재:', !!improved.imageUrl);
        console.log('- improved.imageGenerationSuccess:', improved.imageGenerationSuccess);
        console.log('- improved.imageGenerationError:', improved.imageGenerationError);

        // 개선 정보 확정 (이미지 생성 성공 시 dataURL 포함될 수 있음)
        setImprovedIdea({
          ...originalIdea,
          title: improved.title,
          description: improved.description,
          imageUrl: improved.imageUrl || originalIdea.imageUrl || null,
          isImproved: true,
          dalleGenerated: !!improved.imageGenerationSuccess,
          dalleError: improved.imageGenerationError || null,
          originalImagePrompt: improved.originalImagePrompt || null
        });
        
        console.log('✅ ResultPage: improvedIdea 상태 업데이트 완료');
        console.log('🖼️ 최종 표시될 이미지:', improved.imageUrl ? '새 이미지' : '원본 이미지');
        
        // 로딩 exit 애니메이션 시작
        setLoadingExit(true);
        
        // 0.6초 후 로딩 완전 종료
        setTimeout(() => {
          if (mounted) {
            setLoadingImprovedInfo(false);
            setLoadingExit(false);
          }
        }, 600);
        
      } catch (e) {
        if (!mounted) return;
        console.error('❌ ResultPage: 개선 생성 실패:', e);
        setImprovedIdea({
          ...originalIdea,
          title: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 개선된 ${originalIdea.title}`,
          description: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 첨가제로 개선한 버전입니다.`,
          imageUrl: originalIdea.imageUrl || null,
          isImproved: true,
          dalleGenerated: false,
          dalleError: e.message
        });
        
        // 로딩 exit 애니메이션 시작
        setLoadingExit(true);
        
        // 0.6초 후 로딩 완전 종료
        setTimeout(() => {
          if (mounted) {
            setLoadingImprovedInfo(false);
            setLoadingExit(false);
          }
        }, 600);
        
      }
    };

    run();
    return () => { mounted = false; };
  }, [gptResponse, originalIdea, additiveType, visionAnalysis]);

  // dataURL이면 Storage에 업로드해서 https URL로 치환
  const ensureUrlStored = async (maybeDataUrl, pathId) => {
    if (!maybeDataUrl) return null;
    if (typeof maybeDataUrl === 'string' && maybeDataUrl.startsWith('data:')) {
      // projects/{projectId}/results/{pathId}.png 로 저장 (경로는 자유롭게 조절)
      return await uploadDataUrl(
        maybeDataUrl,
        `projects/${projectId}/results/${pathId}.png`
      );
    }
    return maybeDataUrl; // 이미 https URL이면 그대로 사용
  };

  const handleSaveExperiment = async () => {
    try {
      setSaving(true);
      if (!projectId || !ideaId || !experimentId) {
        throw new Error('필수 식별자(projectId/ideaId/experimentId)가 없습니다.');
      }

      // 1) 결과 이미지 업로드 (dataURL → Storage)
      const finalResultImageUrl = await ensureUrlStored(
        improvedIdea?.imageUrl || originalIdea?.imageUrl || null,
        `${experimentId}_result`
      );

      // 2) steps 등 중첩 데이터는 clean 처리
      const safeSteps = clean(gptResponse?.steps);

      // 3) 실험 문서 업데이트
      const experimentRef = doc(
        db,
        'projects',
        projectId,
        'ideas',
        ideaId,
        'experiments',
        experimentId
      );

      const finalExperimentData = clean({
        status: 'completed',
        result: {
          title: improvedIdea?.title || gptResponse?.title || originalIdea?.title,
          description:
            improvedIdea?.description ||
            gptResponse?.description ||
            originalIdea?.description,
          imageUrl: finalResultImageUrl,       // ✅ URL만 저장
          steps: safeSteps,
          ...(improvedIdea?.dalleGenerated && {
            dalleGenerated: true,
            originalImagePrompt: improvedIdea.originalImagePrompt || null
          }),
          ...(improvedIdea?.dalleError && {
            dalleGenerationFailed: true,
            dalleError: improvedIdea.dalleError || null
          })
        },
        ...(additiveType === 'aesthetics' && referenceImage && {
          referenceImageUrl: referenceImage
        }),
        completedAt: new Date(),
        updatedAt: new Date()
      });

      await updateDoc(experimentRef, finalExperimentData);

      // 4) 생성물 아이디어 문서 생성
      const { id: newIdeaId } = await getNextIdWithCounter(
        `counters/projects/${projectId}/result_ideas`,
        'result_idea'
      );

      const finalGeneratedImageUrl = await ensureUrlStored(
        improvedIdea?.imageUrl || originalIdea?.imageUrl || null,
        newIdeaId
      );

      const tagMap = { creativity: '#창의개선', aesthetics: '#심미개선', usability: '#사용개선' };
      const resultTag = tagMap[additiveType] || '#생성물';
      const nextGeneration = calculateGeneration(originalIdea);

      const generatedIdeaData = clean({
        id: newIdeaId,
        title: improvedIdea?.title || gptResponse?.title || originalIdea?.title,
        description:
          improvedIdea?.description ||
          gptResponse?.description ||
          originalIdea?.description,
        imageUrl: finalGeneratedImageUrl,     // ✅ URL만 저장
        tags: [resultTag],
        type: 'generated',
        additiveType,
        generation: nextGeneration,           // ✅ generation 정보 저장
        sourceExperimentId: experimentId,
        sourceIdeaId: ideaId,
        additiveIntensity,
        ...(improvedIdea?.dalleGenerated && {
          dalleGenerated: true,
          originalImagePrompt: improvedIdea.originalImagePrompt || null
        }),
        ...(improvedIdea?.dalleError && {
          dalleGenerationFailed: true,
          dalleError: improvedIdea.dalleError || null
        }),
        createdAt: new Date()
      });

      await setDoc(doc(db, 'projects', projectId, 'ideas', newIdeaId), generatedIdeaData);

      alert('실험 결과가 성공적으로 저장되었습니다!');
      navigate('/lab', { state: { projectId } });
    } catch (error) {
      console.error('실험 결과 저장 실패:', error);
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResult = () => {
    // 생성된 아이디어가 마음에 들지 않을 때 LabPage로 돌아가기
    // dropItem은 유지된 상태로 돌아감 (originalIdea 상태 전달)
    navigate('/lab', { 
      state: { 
        projectId,
        preservedDropItem: originalIdea // 원본 아이디어 상태를 전달
      } 
    });
  };

  return (
    <LayoutWrap>
      <Header type="back" onClick={() => navigate('/lab', { state: { projectId } })}>
        Project Name
      </Header>

      <ContentWrap>
        {loadingImprovedInfo ? (
          <DropItem
            title={originalIdea?.title || "아이디어"}
            imageUrl={originalIdea?.imageUrl || null}
            content={originalIdea?.description || "아이디어를 개선하고 있습니다."}
            type="original"
            additiveType={additiveType}
            generation={calculateGeneration(originalIdea)}
            pageType="result"
            loading={true}
            loadingColor={ADDITIVE_COLORS[additiveType] || '#5755FE'}
            loadingExit={loadingExit}
          />
        ) : improvedIdea ? (
          <DropItem
            title={improvedIdea.title}
            imageUrl={improvedIdea.imageUrl}
            content={improvedIdea.description}
            type="result"
            additiveType={additiveType}
            generation={calculateGeneration(originalIdea)}
            pageType="result"
          />
        ) : originalIdea && (
          <DropItem
            title={originalIdea.title}
            imageUrl={originalIdea.imageUrl}
            content={originalIdea.description}
            type="result"
            additiveType={additiveType}
            generation={calculateGeneration(originalIdea)}
            pageType="result"
          />
        )}

        <ResultReport
          brandColor={location.state?.brandColor}
          experimentResult={gptResponse}
          additiveType={additiveType}
          additiveIntensity={additiveIntensity}
        />
      </ContentWrap>

      {needsSaving && (
        <>
          {/* 삭제 버튼 (왼쪽) */}
          <ActionBtn
            type="delete"
            iconName="delete"
            onClick={handleDeleteResult}
            style={{ position: 'absolute', right: 180, bottom: 36 }}
          />
          
          {/* 저장 버튼 (오른쪽) */}
          <ActionBtn
            type={saving ? 'disabled' : 'default'}
            iconName="arrow_forward"
            title={saving ? '저장 중...' : '저장하기'}
            onClick={handleSaveExperiment}
            disabled={saving}
            style={{ position: 'absolute', right: 32, bottom: 36 }}
          />
        </>
      )}
    </LayoutWrap>
  );
}

export default ResultPage;

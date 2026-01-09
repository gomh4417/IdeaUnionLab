import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextIdWithCounter } from '../utils/firebaseCounter';
import { improveProduct, analyzeImageWithVision } from '../utils/Aiapi';
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
  gap: 16px;
  margin-left: 8px;
`;

const SaveSuccessOverlay = styled.div`
  position: fixed;
  top: 50vh;
  left: 50vw;
  transform: translate(-50%, -50%);
  background: #00000040;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  border-radius: 12px;
  overflow: hidden;
`;

const SaveSuccessModal = styled.div`
  background: #ffffff98;
  backdrop-filter: blur(10px);
  padding: 32px 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #222;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // LabPage에서 전달된 값
  const experimentId = location.state?.experimentId;
  const projectId = location.state?.projectId;
  const ideaId = location.state?.ideaId;
  const originalIdea = location.state?.originalIdea;
  const resultIdea = location.state?.resultIdea;
  const additiveType = location.state?.additiveType;
  const additiveIntensity = location.state?.additiveIntensity;
  const referenceImage = location.state?.referenceImage;
  const visionAnalysis = location.state?.visionAnalysis; // Vision API 분석 결과
  const gptResponse = location.state?.gptResponse;
  const needsSaving = location.state?.needsSaving;

  // 🔍 ResultPage에 전달된 데이터 로깅
  useEffect(() => {
    console.log('📄 ResultPage 마운트됨');
    console.log('📦 전달받은 state 데이터:');
    console.log('  - experimentId:', experimentId);
    console.log('  - projectId:', projectId);
    console.log('  - ideaId:', ideaId);
    console.log('  - needsSaving:', needsSaving);
    console.log('  - originalIdea:', originalIdea);
    console.log('  - resultIdea:', resultIdea);
    console.log('  - additiveType:', additiveType);
    if (resultIdea) {
      console.log('🎯 resultIdea 상세:');
      console.log('    - id:', resultIdea.id);
      console.log('    - generation:', resultIdea.generation);
      console.log('    - title:', resultIdea.title);
      console.log('    - imageUrl:', resultIdea.imageUrl);
      console.log('    - type:', resultIdea.type);
    }
  }, [experimentId, projectId, ideaId, needsSaving, originalIdea, resultIdea, additiveType]);

  // generation 계산 함수
  // ⚠️ 주의: 과거 기록 보기 모드(needsSaving=false, isHistoryView=true)에서는
  // 현재 아이디어의 generation을 그대로 표시해야 함 (새로운 실험이 아니므로 +1 하지 않음)
  const calculateGeneration = (baseIdea, options = {}) => {
    const { resultOverride } = options;

    if (!baseIdea) {
      return resultOverride?.generation || 1;
    }
    
    // 🔥 과거 기록 보기 모드인 경우 결과물의 generation을 우선 사용
    if (!needsSaving || baseIdea.isHistoryView) {
      if (resultOverride?.generation) {
        return resultOverride.generation;
      }
      return baseIdea.generation || 1;
    }
    
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
      // 과거 기록 보기 모드에서는 AI API 호출하지 않음
      if (!needsSaving) {
        console.log('🔍 과거 기록 보기 모드 - AI API 호출 생략');
        // 과거 기록인 경우 resultIdea를 우선 사용
        if (resultIdea) {
          console.log('📚 과거 기록 보기: resultIdea 사용');
          console.log('  - resultIdea.imageUrl:', resultIdea.imageUrl);
          console.log('  - resultIdea.generation:', resultIdea.generation);
          setImprovedIdea({
            ...resultIdea,
            isImproved: true,
            dalleGenerated: !!resultIdea.dalleGenerated,
            dalleError: resultIdea.dalleError || null
          });
        } else if (gptResponse && originalIdea) {
          // resultIdea가 없는 레거시 데이터 대비
          setImprovedIdea({
            ...originalIdea,
            title: gptResponse.title || originalIdea.title,
            description: gptResponse.description || originalIdea.description,
            imageUrl: originalIdea.imageUrl,
            isImproved: true,
            dalleGenerated: false
          });
        }
        return;
      }
      
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
        console.log('- originalIdea.imageUrl:', originalIdea.imageUrl);
        console.log('- originalIdea 전체 데이터 구조:', Object.keys(originalIdea));
        
        // 이미지 URL이 없는 경우 경고 메시지 표시
        if (!originalIdea.imageUrl || typeof originalIdea.imageUrl !== 'string' || originalIdea.imageUrl.trim() === '') {
          console.error('❌ Firebase 데이터에서 imageUrl 찾을 수 없음:', {
            id: originalIdea.id,
            title: originalIdea.title,
            imageUrl: originalIdea.imageUrl,
            전체데이터: originalIdea
          });
          alert(`원본 아이디어 "${originalIdea.title || 'Unknown'}"에 이미지 URL이 없습니다.\nFirebase에서 imageUrl 필드를 확인해주세요.`);
        }
        
        const improved = await improveProduct(
          originalIdea.title,
          originalIdea.description,
          gptResponse.steps,
          additiveType,
          visionAnalysis || '', // Vision API 분석 결과 전달
          originalIdea.imageUrl || null, // 원본 이미지 URL 전달 (null 안전 처리)
          additiveType === 'aesthetics' ? referenceImage : null, // 심미성 첨가제인 경우 레퍼런스 이미지 전달
          additiveIntensity // 슬라이더 값을 sliderValue로 전달
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
  }, [gptResponse, originalIdea, resultIdea, additiveType, visionAnalysis, needsSaving, additiveIntensity, referenceImage]);

  // 🔥 과거 기록 보기 모드에서는 resultIdea의 generation을 우선 사용
  const generationForDisplay = !needsSaving && (resultIdea?.generation || improvedIdea?.generation)
    ? (resultIdea?.generation || improvedIdea?.generation)
    : calculateGeneration(originalIdea, !needsSaving ? { resultOverride: resultIdea || improvedIdea } : {});

  // dataURL이면 Storage에 업로드해서 https URL로 치환
  const ensureUrlStored = async (maybeDataUrl, pathId) => {
    if (!maybeDataUrl) return null;
    if (typeof maybeDataUrl === 'string' && maybeDataUrl.startsWith('data:')) {
      console.log('Firebase Storage 업로드 시작:', pathId);
      const storedUrl = await uploadDataUrl(
        maybeDataUrl,
        `projects/${projectId}/results/${pathId}.png`
      );
      console.log('Firebase Storage 업로드 완료:', storedUrl);
      return storedUrl;
    }
    return maybeDataUrl; // 이미 https URL이면 그대로 사용
  };

  const handleSaveExperiment = async () => {
    try {
      setSaving(true);
      if (!projectId || !ideaId || !experimentId) {
        throw new Error('필수 식별자(projectId/ideaId/experimentId)가 없습니다.');
      }

      console.log('💾 저장 시작:', { projectId, ideaId, experimentId });
      console.log('📦 originalIdea:', originalIdea);
      console.log('📦 improvedIdea:', improvedIdea);
      console.log('🖼️ improvedIdea.imageUrl:', improvedIdea?.imageUrl);
      console.log('🖼️ originalIdea.imageUrl:', originalIdea?.imageUrl);

      // 🔥 원재료 아이디어 ID 확정 (저장 전에 먼저 계산)
      // - 원본이 원재료(idea_0xx)면 그대로 사용
      // - 원본이 생성물(result_idea_0xx)이면 sourceIdeaId를 거슬러 올라가 원재료 찾기
      let rootIdeaId = ideaId;
      if (originalIdea?.type === 'generated' && originalIdea?.sourceIdeaId) {
        // 생성물인 경우, sourceIdeaId를 계속 추적하여 원재료 찾기
        let currentId = originalIdea.sourceIdeaId;
        let iterationLimit = 10; // 무한 루프 방지
        
        while (iterationLimit > 0) {
          const tempIdeaRef = doc(db, 'projects', projectId, 'ideas', currentId);
          const tempIdeaDoc = await getDoc(tempIdeaRef);
          
          if (!tempIdeaDoc.exists()) {
            console.warn('⚠️ 원재료 추적 중 문서를 찾을 수 없음:', currentId);
            break;
          }
          
          const tempIdeaData = tempIdeaDoc.data();
          
          // 원재료를 찾았거나, sourceIdeaId가 없으면 중단
          if (!tempIdeaData.type || tempIdeaData.type === 'original' || !tempIdeaData.sourceIdeaId) {
            rootIdeaId = currentId;
            console.log('✅ 원재료 아이디어 발견:', rootIdeaId);
            break;
          }
          
          // 다음 단계로
          currentId = tempIdeaData.sourceIdeaId;
          iterationLimit--;
        }
      }
      
      console.log('📍 실험이 저장될 원재료 아이디어 ID:', rootIdeaId);

      // 🔥 실험 ID에 알파벳 접미사 추가 (A, B, C...)
      // 🔥 중요: 모든 실험은 원재료 아이디어(rootIdeaId)의 experiments에 저장
      const experimentsCollectionRef = collection(db, 'projects', projectId, 'ideas', rootIdeaId, 'experiments');
      const existingExperimentsSnapshot = await getDocs(experimentsCollectionRef);
      
      // experimentId 기본 번호 추출 (예: exp_001에서 001 추출)
      const baseExperimentNumber = experimentId.replace('exp_', '');
      
      // 같은 번호로 시작하는 실험들 찾기 (exp_001_A, exp_001_B 등)
      const existingVariants = existingExperimentsSnapshot.docs
        .map(doc => doc.id)
        .filter(id => id.startsWith(`exp_${baseExperimentNumber}`))
        .sort();
      
      console.log('🔍 기존 실험 변형들:', existingVariants);
      
      // 다음 알파벳 결정
      let suffix = 'A';
      if (existingVariants.length > 0) {
        // 마지막 변형의 접미사 추출
        const lastVariant = existingVariants[existingVariants.length - 1];
        const lastSuffix = lastVariant.split('_').pop(); // 마지막 부분 (A, B, C...)
        
        // 알파벳인 경우에만 다음 문자 계산
        if (lastSuffix && /^[A-Z]$/.test(lastSuffix)) {
          const nextCharCode = lastSuffix.charCodeAt(0) + 1;
          suffix = String.fromCharCode(nextCharCode);
        } else if (!lastSuffix.includes('_')) {
          // 접미사가 없는 경우 (레거시 exp_001 형식)
          suffix = 'B'; // 기존 것을 A로 간주하고 B부터 시작
        }
      }
      
      // 최종 실험 ID: exp_001_A, exp_001_B 형식
      const finalExperimentId = `exp_${baseExperimentNumber}_${suffix}`;
      console.log('✨ 최종 실험 ID:', finalExperimentId);

      // 2) ideas 컬렉션에 새로운 생성물 문서 추가
      const ideasRef = collection(db, 'projects', projectId, 'ideas');
      const ideasSnapshot = await getDocs(ideasRef);
      const existingIds = ideasSnapshot.docs.map(d => d.id);
      
      // result_idea_0xx 형식으로 ID 생성
      let generatedIdeaId = null;
      for (let i = 1; i <= 999; i++) {
        const candidateId = `result_idea_${String(i).padStart(3, '0')}`;
        if (!existingIds.includes(candidateId)) {
          generatedIdeaId = candidateId;
          break;
        }
      }

      if (!generatedIdeaId) {
        throw new Error('새로운 아이디어 ID를 생성할 수 없습니다.');
      }

      console.log('🆔 새로운 생성물 아이디어 ID:', generatedIdeaId);

      // 🔥 1) 결과 이미지 업로드 (dataURL → Storage)
      // ⚠️ 중요: 최종 실험 ID와 생성물 ID를 사용하여 고유한 경로 생성
      const finalResultImageUrl = await ensureUrlStored(
        improvedIdea?.imageUrl || originalIdea?.imageUrl || null,
        `${finalExperimentId}_${generatedIdeaId}_result` // 🔥 고유한 경로 사용
      );

      console.log('🖼️ 최종 결과 이미지 URL:', finalResultImageUrl);

      // 새로운 생성물 아이디어 문서 생성
      const newIdeaRef = doc(db, 'projects', projectId, 'ideas', generatedIdeaId);
      const newIdeaData = {
        id: generatedIdeaId,
        title: improvedIdea?.title || originalIdea?.title || '새로운 아이디어',
        description: improvedIdea?.description || originalIdea?.description || '',
        imageUrl: finalResultImageUrl,
        type: 'generated',
        additiveType: additiveType,
        generation: calculateGeneration(originalIdea),
        sourceIdeaId: ideaId,
        sourceExperimentId: finalExperimentId, // 🔥 최종 실험 ID 사용
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // tags 정보 추가 (첨가제 타입에 따라)
        tags: additiveType === 'creativity' ? ['#창의개선'] :
              additiveType === 'aesthetics' ? ['#심미개선'] :
              additiveType === 'usability' ? ['#사용개선'] : ['#생성물']
      };

      await setDoc(newIdeaRef, clean(newIdeaData));
      console.log('✅ 새로운 생성물 아이디어 저장 완료:', generatedIdeaId);
      
      // 실험 문서 레퍼런스 생성
      // 🔥 모든 실험은 원재료 아이디어(rootIdeaId)의 experiments에 저장
      const experimentRef = doc(
        db,
        'projects',
        projectId,
        'ideas',
        rootIdeaId,
        'experiments',
        finalExperimentId
      );

      // 🔥 이전 실험 기록 가져오기 (2차 이상 실험인 경우)
      let previousExperimentData = null;
      if (originalIdea?.sourceExperimentId && originalIdea?.sourceIdeaId) {
        try {
          // 🔥 이전 실험도 원재료 아이디어의 experiments에서 찾기
          // sourceIdeaId가 생성물이면 그 생성물을 만든 실험을 찾아야 함
          let prevRootId = originalIdea.sourceIdeaId;
          
          // sourceIdeaId가 생성물인지 확인
          const sourceIdeaRef = doc(db, 'projects', projectId, 'ideas', originalIdea.sourceIdeaId);
          const sourceIdeaDoc = await getDoc(sourceIdeaRef);
          
          if (sourceIdeaDoc.exists()) {
            const sourceIdeaData = sourceIdeaDoc.data();
            // 생성물이면 그것의 sourceIdeaId를 거슬러 올라가 원재료 찾기
            if (sourceIdeaData.type === 'generated' && sourceIdeaData.sourceIdeaId) {
              let tempId = sourceIdeaData.sourceIdeaId;
              let limit = 10;
              
              while (limit > 0) {
                const tempRef = doc(db, 'projects', projectId, 'ideas', tempId);
                const tempDoc = await getDoc(tempRef);
                
                if (!tempDoc.exists()) break;
                
                const tempData = tempDoc.data();
                if (!tempData.type || tempData.type === 'original' || !tempData.sourceIdeaId) {
                  prevRootId = tempId;
                  break;
                }
                
                tempId = tempData.sourceIdeaId;
                limit--;
              }
            }
          }
          
          const prevExpRef = doc(
            db,
            'projects',
            projectId,
            'ideas',
            prevRootId,
            'experiments',
            originalIdea.sourceExperimentId
          );
          const prevExpDoc = await getDoc(prevExpRef);
          if (prevExpDoc.exists()) {
            previousExperimentData = prevExpDoc.data();
            console.log('📚 이전 실험 기록 로드 완료:', originalIdea.sourceExperimentId);
          }
        } catch (error) {
          console.warn('⚠️ 이전 실험 기록 로드 실패:', error);
        }
      }

      // 🔥 현재 실험 데이터 (플랫한 구조)
      const currentExperimentData = {
        // 기본 정보
        experimentId: String(finalExperimentId), // 🔥 알파벳 접미사가 추가된 ID 사용
        projectId: String(projectId),
        rootIdeaId: String(rootIdeaId), // 🔥 원재료 아이디어 ID (experiments 저장 위치)
        sourceIdeaId: String(ideaId), // 🔥 실험 대상이었던 아이디어 ID (원재료 또는 생성물)
        status: 'completed',
        generation: Number(calculateGeneration(originalIdea)),
        resultIdeaId: String(generatedIdeaId),
        
        // 🖼️ 실험 대상 아이디어 정보 (DropItem 표시용)
        original_title: String(originalIdea?.title || ''),
        original_description: String(originalIdea?.description || ''),
        original_imageUrl: String(originalIdea?.imageUrl || ''), // 🔥 실험 대상이었던 이미지
        original_type: String(originalIdea?.type || 'original'),
        original_generation: Number(originalIdea?.generation || 0),
        
        // 현재 실험의 결과 정보 (실험 결과 - 저장될 생성물)
        current_title: String(improvedIdea?.title || gptResponse?.title || originalIdea?.title || ''),
        current_description: String(improvedIdea?.description || gptResponse?.description || originalIdea?.description || ''),
        current_imageUrl: String(finalResultImageUrl || ''), // 🔥 실험 결과로 생성된 이미지
        current_additiveType: String(additiveType || ''),
        current_additiveIntensity: Number(additiveIntensity || 0),
        current_referenceImageUrl: String(additiveType === 'aesthetics' ? (referenceImage || '') : ''),
        current_visionAnalysis: String(visionAnalysis || ''),
        
        // 현재 실험의 ResultReport 데이터 (Step별로 플랫하게)
        current_step1_title: String(gptResponse?.steps?.[0]?.title || ''),
        current_step1_description: String(gptResponse?.steps?.[0]?.description || ''),
        current_step2_title: String(gptResponse?.steps?.[1]?.title || ''),
        current_step2_description: String(gptResponse?.steps?.[1]?.description || ''),
        current_step3_title: String(gptResponse?.steps?.[2]?.title || ''),
        current_step3_data: JSON.stringify(gptResponse?.steps?.[2] || {}), // step3는 구조가 복잡해서 JSON으로
        current_step4_title: String(gptResponse?.steps?.[3]?.title || ''),
        current_step4_description: String(gptResponse?.steps?.[3]?.description || ''),
        
        // 타임스탬프
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      // 🔥 이전 실험 기록이 있으면 prev_ 접두사로 추가
      if (previousExperimentData) {
        currentExperimentData.prev_experimentId = String(previousExperimentData.experimentId || '');
        currentExperimentData.prev_title = String(previousExperimentData.current_title || '');
        currentExperimentData.prev_description = String(previousExperimentData.current_description || '');
        currentExperimentData.prev_imageUrl = String(previousExperimentData.current_imageUrl || '');
        currentExperimentData.prev_additiveType = String(previousExperimentData.current_additiveType || '');
        currentExperimentData.prev_additiveIntensity = Number(previousExperimentData.current_additiveIntensity || 0);
        currentExperimentData.prev_referenceImageUrl = String(previousExperimentData.current_referenceImageUrl || '');
        currentExperimentData.prev_visionAnalysis = String(previousExperimentData.current_visionAnalysis || '');
        
        currentExperimentData.prev_step1_title = String(previousExperimentData.current_step1_title || '');
        currentExperimentData.prev_step1_description = String(previousExperimentData.current_step1_description || '');
        currentExperimentData.prev_step2_title = String(previousExperimentData.current_step2_title || '');
        currentExperimentData.prev_step2_description = String(previousExperimentData.current_step2_description || '');
        currentExperimentData.prev_step3_title = String(previousExperimentData.current_step3_title || '');
        currentExperimentData.prev_step3_data = String(previousExperimentData.current_step3_data || '{}');
        currentExperimentData.prev_step4_title = String(previousExperimentData.current_step4_title || '');
        currentExperimentData.prev_step4_description = String(previousExperimentData.current_step4_description || '');
        
        // 이전 실험의 prev_ 데이터가 있으면 prev_prev_로 추가 (3차 이상)
        if (previousExperimentData.prev_experimentId) {
          currentExperimentData.prev_prev_experimentId = String(previousExperimentData.prev_experimentId || '');
          currentExperimentData.prev_prev_title = String(previousExperimentData.prev_title || '');
          currentExperimentData.prev_prev_additiveType = String(previousExperimentData.prev_additiveType || '');
          // 필요한 만큼 계속 추가 가능...
        }
        
        console.log('📚 이전 실험 기록이 현재 실험에 포함됨');
      }

      // 강제 저장 (merge 없이 완전 덮어쓰기)
      await setDoc(experimentRef, currentExperimentData);
      
      console.log('✅ 실험 데이터 저장 완료');
      console.log('📊 저장된 필드 수:', Object.keys(currentExperimentData).length);

      // 4) 생성물 아이디어의 sourceExperimentId를 최종 실험 ID로 업데이트
      await setDoc(newIdeaRef, { sourceExperimentId: finalExperimentId }, { merge: true });
      console.log('✅ 생성물 아이디어의 sourceExperimentId 업데이트 완료:', finalExperimentId);

      // 저장 성공 모달 표시
      setShowSaveSuccess(true);
      
      // 2초 후 LabPage로 이동
      setTimeout(() => {
        navigate('/lab', { state: { projectId } });
      }, 2000);
      
    } catch (error) {
      console.error('❌ 실험 결과 저장 실패:', error);
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
        {/* 로딩 중이거나 improvedIdea가 아직 생성되지 않은 경우 로딩 화면 표시 */}
        {(loadingImprovedInfo || (!improvedIdea && needsSaving)) ? (
          <DropItem
            title="생성 중"
            imageUrl={originalIdea?.imageUrl || null}
            content="개선된 아이디어를 생성하고 있습니다. 잠시만 기다려주세요."
            type="original"
            additiveType={additiveType}
            generation={generationForDisplay}
            pageType="result"
            loading={true}
            loadingColor={ADDITIVE_COLORS[additiveType] || '#5755FE'}
            loadingExit={loadingExit}
            // 히스토리 버튼을 위한 데이터 (로딩 중에는 표시하지 않음)
            projectId={projectId}
            ideaId={ideaId}
            sourceExperimentId={null}
            // 로딩 중에는 HistoryList 표시하지 않음
            showHistoryList={false}
          />
        ) : improvedIdea ? (
          <DropItem
            title={improvedIdea.title}
            imageUrl={improvedIdea.imageUrl || resultIdea?.imageUrl} // 🔥 resultIdea의 imageUrl도 fallback으로 사용
            content={improvedIdea.description}
            type="result"
            additiveType={additiveType}
            generation={generationForDisplay}
            pageType="result"
            // 히스토리 버튼을 위한 데이터 (ResultPage에서는 보통 표시하지 않음)
            projectId={projectId}
            ideaId={resultIdea?.id || ideaId}
            sourceExperimentId={null}
            // HistoryList는 과거 기록 보기 모드에서만 표시
            showHistoryList={!needsSaving}
          />
        ) : null}

        <ResultReport
          brandColor={location.state?.brandColor}
          experimentResult={gptResponse}
          additiveType={additiveType}
          originalIdea={originalIdea}
          sourceImageUrl={location.state?.sourceImageUrl} // 🔥 실험 대상이었던 원본 이미지 URL 전달
        />
      </ContentWrap>

      {needsSaving && (
        <>
          {/* 삭제 버튼 (왼쪽) */}
          <ActionBtn
            type="delete"
            iconName="delete"
            onClick={handleDeleteResult}
            style={{ position: 'absolute', right: 220, bottom: 36 }}
          />
          
          {/* 저장 버튼 (오른쪽) */}
          <ActionBtn
            type={saving ? 'disabled' : 'default'}
            iconName="arrow_forward"
            title={saving ? '저장 중...' : '저장하기'}
            onClick={handleSaveExperiment}
            disabled={saving}
            style={{ position: 'absolute', right: 40, bottom: 36 }}
          />
        </>
      )}
      
      {/* 저장 성공 모달 */}
      {showSaveSuccess && (
        <SaveSuccessOverlay>
          <SaveSuccessModal>
            실험 결과가 성공적으로 저장되었습니다!
          </SaveSuccessModal>
        </SaveSuccessOverlay>
      )}
    </LayoutWrap>
  );
}

export default ResultPage;

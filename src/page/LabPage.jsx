import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../jsx/Sidebar';
import Header from '../jsx/Header';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { useDrop } from 'react-dnd';
import { useState, useEffect } from 'react';
import Icons from '../jsx/Icons';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateIdeaWithAdditive, analyzeReferenceImage, generateImprovedProductInfo } from '../utils/gptApi';
import { getNextIdWithCounter } from '../utils/firebaseCounter';

import ActionBtn from '../jsx/ActionBtn';
import DropItem from '../jsx/DropItem';
import AdditiveBar from '../jsx/AdditiveBar';


const LayoutWrap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 25px 32px 32px 32px;
  
`;

const ContentWrap = styled.div`
  display: flex;
  gap: 40px;
`;

const DropArea = styled.div`
  width: 840px;
  height: 724px;
  border: 1.5px dashed ${theme.colors.gray[300]};
  border-radius: ${theme.radius.large};
  background: #fbfbfb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 24px;
  transition: border 0.2s;
  position: relative;
  &.hover {
    border: 2px dashed ${theme.colors.gray[500]};
  }
`;


function LabPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  // URL state에서 프로젝트 정보 가져오기
  const projectId = location.state?.projectId;
  
  // projectId가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!projectId) {
      alert('프로젝트 정보가 없습니다. 홈화면에서 다시 시작해주세요.');
      navigate('/');
    }
  }, [projectId, navigate]);

  // 현재 프로젝트의 아이디어 목록
  const [items, setItems] = useState([]);
  
  // 프로젝트 정보 상태
  const [projectInfo, setProjectInfo] = useState(null);
  
  // 드롭 상태 관리
  const [dropped, setDropped] = useState(false);
  const [isItemOver, setIsItemOver] = useState(false);
  const [activatedIdx, setActivatedIdx] = useState(null);
  const [droppedItemData, setDroppedItemData] = useState(null); // 드롭된 아이템 데이터
  const [isReplacingItem, setIsReplacingItem] = useState(false); // 아이템 교체 모드
  
  // AdditiveBar 관련 상태
  const [selectedAdditive, setSelectedAdditive] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [sliderTouched, setSliderTouched] = useState(false); // 슬라이더 조작 여부
  const [referenceImage, setReferenceImage] = useState(null); // 레퍼런스 이미지 상태
  
  // 개선된 제품 정보 상태 (GPT 응답 후 업데이트)
  const [improvedProductInfo, setImprovedProductInfo] = useState(null);
  
  // gif 반복 재생을 위한 key state
  const [gifKey, setGifKey] = useState(Date.now());

  // 프로젝트 정보 로드 (메모이제이션으로 중복 호출 방지)
  useEffect(() => {
    let isMounted = true;
    
    const loadProjectInfo = async () => {
      if (!projectId) return;
      
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('프로젝트 정보 로딩 시작:', projectId);
        }
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (projectDoc.exists() && isMounted) {
          const projectData = projectDoc.data();
          setProjectInfo(projectData);
        }
      } catch (error) {
        console.error('프로젝트 정보 로딩 실패:', error);
      }
    };
    
    loadProjectInfo();
    
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // 프로젝트 아이디어 로드 (최적화된 로딩)
  useEffect(() => {
    let isMounted = true;
    
    const loadIdeas = async () => {
      if (!projectId) return;
      
      try {
        const ideasCollection = collection(db, "projects", projectId, "ideas");
        const ideasSnapshot = await getDocs(ideasCollection);
        const ideasData = [];
        
        ideasSnapshot.forEach((doc) => {
          const ideaData = { id: doc.id, ...doc.data() };
          ideasData.push(ideaData);
        });
        
        if (isMounted) {
          setItems(ideasData);
        }
      } catch (error) {
        console.error('아이디어 로딩 실패:', error);
        if (isMounted) {
          setItems([]);
        }
      }
    };
    
    loadIdeas();
    
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // 첨가제 타입이 변경될 때 레퍼런스 이미지 초기화
  useEffect(() => {
    if (selectedAdditive !== 'aesthetics') {
      setReferenceImage(null);
    }
  }, [selectedAdditive]);

  useEffect(() => {
    if (dropped) return; // dropped면 interval 멈춤
    const intervalId = setInterval(() => {
      setGifKey(Date.now());
    }, 7500);
    return () => clearInterval(intervalId);
  }, [dropped]);

  // 삭제 핸들러 (ItemList에 전달)
  const handleDeleteItem = async (idx) => {
    if (!projectId || !items[idx]) return;
    
    const itemToDelete = items[idx];
    
    try {
      // Firebase에서 아이디어 문서 삭제
      await deleteDoc(doc(db, "projects", projectId, "ideas", itemToDelete.id));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Firebase에서 아이디어 삭제 완료:', itemToDelete.id);
      }
      
      // 로컬 state에서도 제거
      setItems(prev => {
        const newArr = prev.filter((_, i) => i !== idx);
        // 현재 drop된 아이템이 삭제되거나, 모두 삭제되면 dropped 해제
        if (activatedIdx === idx || newArr.length === 0) {
          setDropped(false);
          setActivatedIdx(null);
          setDroppedItemData(null);
          setSelectedAdditive(null);
          setSliderValue(0);
          setSliderTouched(false);
          setReferenceImage(null);
          setImprovedProductInfo(null);
        }
        return newArr;
      });
    } catch (error) {
      console.error('아이디어 삭제 실패:', error);
      alert('아이디어 삭제 중 오류가 발생했습니다.');
    }
  };

  // 프로젝트 이름 저장 핸들러
  const handleSaveProjectName = async (newTitle) => {
    if (!projectId || !newTitle.trim()) return;
    
    try {
      // Firebase에서 프로젝트 제목 업데이트
      await updateDoc(doc(db, "projects", projectId), {
        title: newTitle.trim(),
        updatedAt: new Date()
      });
      
      // 로컬 state 업데이트
      setProjectInfo(prev => prev ? { ...prev, title: newTitle.trim() } : null);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('프로젝트 이름 업데이트 완료:', newTitle.trim());
      }
    } catch (error) {
      console.error('프로젝트 이름 업데이트 실패:', error);
      alert('프로젝트 이름 변경 중 오류가 발생했습니다.');
    }
  };

  // react-dnd drop 영역
  const [{ isOver }, drop] = useDrop({
    accept: 'ITEM',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: (item, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        setIsItemOver(true);
        // 이미 drop된 상태에서 새로운 아이템이 hover되면 교체 모드 활성화
        if (dropped && item.idx !== activatedIdx) {
          setIsReplacingItem(true);
        }
      }
    },
    // drop 시 드롭된 item의 idx를 활성화
    drop: (item) => {
      const isNewItem = item.idx !== activatedIdx;
      
      // 새로운 아이템이거나 첫 번째 drop인 경우
      if (!dropped || isNewItem) {
        // 기존 활성화된 아이템이 있다면 비활성화
        if (activatedIdx !== null) {
          // 기존 아이템의 상태를 default로 변경하는 로직은 Sidebar에서 처리됨
        }
        
        setDropped(true);
        setIsItemOver(false);
        setIsReplacingItem(false);
        setActivatedIdx(item.idx);
        
        // 드롭된 아이템 데이터 저장
        if (item.itemData) {
          setDroppedItemData(item.itemData);
          if (process.env.NODE_ENV === 'development') {
            console.log('드롭된 아이템 데이터:', item.itemData);
          }
        }
        
        // 새로운 아이템이 드롭되면 첨가제 관련 상태 초기화
        setSelectedAdditive(null);
        setSliderValue(0);
        setSliderTouched(false);
        setReferenceImage(null);
        setImprovedProductInfo(null);
      }
      
      return undefined;
    },
  });
  // isOver 값이 false가 되면(드래그 아웃) 가이드 복구
  useEffect(() => {
    if (!isOver) {
      setIsItemOver(false);
      setIsReplacingItem(false);
    }
  }, [isOver]);

  return (
    <LayoutWrap>
      <Header 
        type="home" 
        onClick={() => navigate('/')}
        showEditIcon={true}
      />
      <ContentWrap>
        <Sidebar
          projects={items}
          activatedIdx={activatedIdx}
          setActivatedIdx={setActivatedIdx}
          onDeleteItem={handleDeleteItem}
          projectId={projectId}
        />
        {/* 드롭 전에는 DropArea, 드롭 후에는 DropItem + AdditiveBar */}
        {dropped && droppedItemData && !isReplacingItem ? (
          <>
            <DropItem 
              title={droppedItemData.title}
              imageUrl={droppedItemData.imageUrl}
              content={droppedItemData.description}
              type={droppedItemData.type === 'generated' ? 'result' : 'original'}
              additiveType={droppedItemData.type === 'generated' ? droppedItemData.additiveType : null}
              generation={1}
              pageType="lab"
            />
            <AdditiveBar
              selectedAdditive={selectedAdditive}
              setSelectedAdditive={setSelectedAdditive}
              sliderValue={sliderValue}
              setSliderValue={setSliderValue}
              sliderTouched={sliderTouched}
              setSliderTouched={setSliderTouched}
              referenceImage={referenceImage}
              setReferenceImage={setReferenceImage}
            />
          </>
        ) : (
          <DropArea
            ref={drop}
            className={isOver ? 'hover' : ''}
            style={{ display: (!dropped || isReplacingItem) ? 'flex' : 'none' }}
          >
            {/* 드래그 중이면 아이콘 표시, 아니면 가이드 */}
            {isItemOver ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Icons 
                  type={isReplacingItem ? "restart_alt" : "upload"} 
                  size={80} 
                  color={theme.colors.gray[400]} 
                />
                {isReplacingItem && (
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 500, 
                    color: theme.colors.gray[500], 
                    marginTop: 12,
                    textAlign: 'center'
                  }}>
                    아이디어 교체하기
                  </div>
                )}
              </div>
            ) : (
              <>
                <img
                  src={`/dragdrop.gif?${gifKey}`}
                  alt="drag guide"
                  style={{ width: 470, height: 220, marginBottom: 12, opacity: 0.8 }}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 500, color: theme.colors.gray[500], marginBottom: 8 }}>
                    {dropped ? "다른 아이디어로 교체하기" : "아이디어 선택하기"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 400, color: theme.colors.gray[400] }}>
                    {dropped ? "리스트에서 다른 아이디어를 드래그하여 교체할 수 있습니다" : "리스트에서 아이디어를 드래그하여 이곳에 드롭해 주세요"}
                  </div>
                </div>
              </>
            )}
          </DropArea>
        )}
      </ContentWrap>
      {dropped && (
        <ActionBtn
          type={selectedAdditive && sliderTouched && !loading ? 'default' : 'disabled'}
          iconName="arrow_forward"
          title={loading ? "실험 중..." : "실험하기"}
          onClick={async () => {
            if (typeof activatedIdx === 'number' && items[activatedIdx] && selectedAdditive && sliderTouched && !loading) {
              try {
                setLoading(true);
                
                const currentIdea = items[activatedIdx];
                
                // 카운터를 사용한 효율적인 실험 ID 생성
                const { id: experimentId } = await getNextIdWithCounter(
                  `counters/projects/${projectId}/ideas/${currentIdea.id}/experiments`, 
                  'exp'
                );
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('생성될 실험 ID:', experimentId);
                  console.log('첨가제 타입:', selectedAdditive);
                  console.log('레퍼런스 이미지 상태:', referenceImage);
                  console.log('레퍼런스 이미지 조건 확인:', selectedAdditive === 'aesthetics', !!referenceImage);
                }
                
                // 실험 데이터 구조 (GPT 프롬프트 제거)
                const experimentData = {
                  id: experimentId,
                  ideaId: currentIdea.id,
                  projectId,
                  additive: {
                    type: selectedAdditive,
                    intensity: sliderValue / 100,
                    description: `${selectedAdditive} 첨가제 ${sliderValue}% 강도`
                  },
                  originalIdea: {
                    title: currentIdea.title,
                    description: currentIdea.description,
                    imageUrl: currentIdea.imageUrl,
                    tags: currentIdea.tags || []
                  },
                  status: 'processing', // 'processing' -> 'completed'
                  result: null, // GPT 응답이 저장되는 위치
                  createdAt: new Date(),
                  updatedAt: new Date()
                };

                // 심미성 첨가제인 경우에만 레퍼런스 이미지 추가
                if (selectedAdditive === 'aesthetics' && referenceImage) {
                  experimentData.referenceImageUrl = referenceImage;
                  if (process.env.NODE_ENV === 'development') {
                    console.log('레퍼런스 이미지 추가됨:', referenceImage.substring(0, 50) + '...');
                  }
                }
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('실험 데이터 생성:', experimentData);
                }
                
                // Firebase에 실험 데이터 저장
                await setDoc(doc(db, "projects", projectId, "ideas", currentIdea.id, "experiments", experimentId), experimentData);
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('실험 데이터 Firebase 저장 완료');
                }
                
                // GPT API 호출로 실제 아이디어 생성
                try {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('GPT API 호출 시작...');
                  }
                  
                  let referenceAnalysis = null;
                  // 심미성 첨가제이고 레퍼런스 이미지가 있는 경우 분석
                  if (selectedAdditive === 'aesthetics' && referenceImage) {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('레퍼런스 이미지 분석 중...');
                    }
                    referenceAnalysis = await analyzeReferenceImage(referenceImage);
                  }
                  
                  // GPT API로 아이디어 생성
                  const gptResponse = await generateIdeaWithAdditive(
                    selectedAdditive,
                    currentIdea.title,
                    currentIdea.description,
                    currentIdea.visionAnalysis || '이미지 분석 결과가 없습니다.',
                    referenceAnalysis,
                    sliderValue // 슬라이더 값 전달
                  );
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('GPT API 응답:', gptResponse);
                  }
                  
                  // Step 1-4 인사이트를 바탕으로 개선된 제품 정보 생성
                  const improvedProductInfo = await generateImprovedProductInfo(
                    currentIdea.title,
                    currentIdea.description,
                    gptResponse.steps || [],
                    selectedAdditive
                  );
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('개선된 제품 정보:', improvedProductInfo);
                  }
                  
                  // 개선된 제품 정보를 상태에 저장하여 DropItem에 반영
                  setImprovedProductInfo(improvedProductInfo);
                  
                  // GPT 응답을 결과 형태로 변환
                  const finalGptResponse = {
                    title: improvedProductInfo.title,
                    description: improvedProductInfo.description,
                    steps: gptResponse.steps || []
                  };
                  
                  // 브랜드 컬러 설정
                  let brandColor = '#5755FE';
                  const colorMap = {
                    creativity: '#5755FE',
                    aesthetics: '#00CD80',
                    usability: '#FD6B03',
                  };
                  brandColor = colorMap[selectedAdditive] || '#5755FE';
                  
                  // ResultPage로 이동 (실제 GPT 결과 전달)
                  navigate('/result', { 
                    state: { 
                      experimentId,
                      projectId,
                      ideaId: currentIdea.id,
                      originalIdea: currentIdea,
                      additiveType: selectedAdditive,
                      additiveIntensity: sliderValue,
                      referenceImage: selectedAdditive === 'aesthetics' ? referenceImage : null,
                      brandColor,
                      gptResponse: finalGptResponse,
                      needsSaving: true
                    } 
                  });
                  
                } catch (gptError) {
                  console.error('GPT API 호출 실패:', gptError);
                  alert(`AI 분석 중 오류가 발생했습니다: ${gptError.message}\n\n잠시 후 다시 시도해주세요.`);
                  return; // 실패 시 더 이상 진행하지 않음
                }
                
              } catch (error) {
                console.error('실험 생성 실패:', error);
                alert(`실험 생성 중 오류가 발생했습니다: ${error.message}`);
              } finally {
                setLoading(false);
              }
            }
          }}
          style={{ position: 'absolute', right: 32, bottom: 36 }}
        />
      )}
    </LayoutWrap>
  );
}

export default LabPage

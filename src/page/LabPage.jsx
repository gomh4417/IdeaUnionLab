import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../jsx/Sidebar';
import Header from '../jsx/Header';
import styled from 'styled-components';
import { theme } from "../styles/theme.js";
import { useDrop } from 'react-dnd';
import { useState, useEffect } from 'react';
import Icons from '../jsx/Icons';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { analyzeIdea, analyzeReferenceImage, improveProductInfo } from '../utils/Aiapi';
import { getNextIdWithCounter } from '../utils/firebaseCounter';

import ActionBtn from '../jsx/ActionBtn';
import DropItem from '../jsx/DropItem';
import AdditiveBar from '../jsx/AdditiveBar';

// 첨가제별 브랜드 컬러 매핑
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

const DropArea = styled.div`
  position: absolute;
  inset: 0;
  border: 1.5px dashed ${theme.colors.gray[300]};
  border-radius: ${theme.radius.large};
  background: #fbfbfb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 24px;
  transition: border 0.2s;
  max-height: 940px;
  width: ${({ $dropped }) => ($dropped ? '1120px' : '1420px')};
  z-index: 20;
  &.hover {
    border: 2px dashed ${theme.colors.gray[500]};
  }
`;

const Stage = styled.div`
  position: absolute;
  width: ${({ $dropped }) => ($dropped ? '1120px' : '1420px')};
  height: 940px;
  margin-left: 368px;
`;

const DropOverlay = styled(DropArea)`
  position: absolute;
  inset: 0;                /* 상하좌우 꽉 채움 */
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
  
  background: ${({ $active }) => ($active ? '#fbfbfbF2' : 'transparent')};
  cursor: ${({ $active }) => ($active ? 'copy' : 'default')};
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
  const [, setProjectInfo] = useState(null);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  
  // 드롭 상태 관리
  const [dropped, setDropped] = useState(false);
  const [isItemOver, setIsItemOver] = useState(false);
  const [activatedId, setActivatedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // 선택된 아이템 데이터
  
  // AdditiveBar 관련 상태
  const [selectedAdditive, setSelectedAdditive] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [sliderTouched, setSliderTouched] = useState(false); // 슬라이더 조작 여부
  const [referenceImage, setReferenceImage] = useState(null); // 레퍼런스 이미지 상태
  
  // 개선된 제품 정보 상태 (GPT 응답 후 업데이트)
  const [, setImprovedProduct] = useState(null);
  
  // gif 반복 재생을 위한 key state
  const [gifKey, setGifKey] = useState(Date.now());

  // generation 계산 함수 - 실험 결과로 생성될 generation을 계산
  // const calculateNextGeneration = (item) => {
  //   if (!item) return 1;
    
  //   // 원본 아이디어(type이 없거나 'original')에서 실험하면 1차 생성물
  //   if (!item.type || item.type === 'original') {
  //     return 1;
  //   }
    
  //   // 생성물인 경우 현재 generation + 1
  //   if (item.type === 'generated') {
  //     // Firebase에 generation이 직접 저장되어 있다면 사용
  //     if (typeof item.generation === 'number') {
  //       return item.generation + 1;
  //     }
      
  //     // additiveType이 있으면 최소 1차 생성물이므로 다음은 2차
  //     if (item.additiveType) {
  //       return (item.generation || 1) + 1;
  //     }
  //   }
    
  //   return 1;
  // };

  // DropItem 표시용 generation 계산 함수 - 현재 아이템의 generation
  const calculateCurrentGeneration = (item) => {
    if (!item) return 1;
    
    // 원본 아이디어는 0차로 표시하지 않고, 생성물만 차수 표시
    if (!item.type || item.type === 'original') {
      return 0; // 원본은 차수 표시 안함
    }
    
    // 생성물인 경우 저장된 generation 사용
    if (item.type === 'generated') {
      if (typeof item.generation === 'number') {
        return item.generation;
      }
      
      if (item.additiveType) {
        return item.generation || 1;
      }
    }
    
    return 1;
  };

  const handleClearSelection = () => {
    // 드롭 리셋
    setDropped(false);
    setIsItemOver(false);
    setActivatedId(null);
    setSelectedItem(null);

    // 첨가제 상태/개선 정보도 리셋
    setSelectedAdditive(null);
    setSliderValue(0);
    setSliderTouched(false);
    setReferenceImage(null);
    setImprovedProduct(null);
  };

  // 모바일 탭 또는 클릭으로 아이템 선택하는 핸들러
  const handleItemSelect = (item) => {
    const isNewItem = item.id !== activatedId;
    
    // 새로운 아이템이거나 첫 번째 선택인 경우
    if (!dropped || isNewItem) {
      setDropped(true);
      setIsItemOver(false);
      setActivatedId(item.id);
      
      // 선택된 아이템 데이터 저장
      if (item) {
        // imageUrl 유효성 검증
        if (!item.imageUrl || typeof item.imageUrl !== 'string' || item.imageUrl.trim() === '') {
          console.error('⚠️ Firebase 데이터에서 imageUrl 찾을 수 없음:', {
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
            전체데이터: item
          });
          alert(`선택한 아이디어 "${item.title || 'Unknown'}"에 이미지 URL이 없습니다.\nFirebase에서 imageUrl 필드를 확인해주세요.`);
        }
        
        setSelectedItem(item);
        if (import.meta.env.DEV) {
          console.log('📋 아이템 선택:', item.title, '| ImageURL 유효:', !!(item.imageUrl && item.imageUrl.trim()));
        }
      }
      
      // 새로운 아이템이 선택되면 첨가제 관련 상태 초기화
      setSelectedAdditive(null);
      setSliderValue(0);
      setSliderTouched(false);
      setReferenceImage(null);
      setImprovedProduct(null);
    }
  };

  // 프로젝트 정보 로드 (메모이제이션으로 중복 호출 방지)
  useEffect(() => {
    let isMounted = true;
    
    const loadProjectInfo = async () => {
      if (!projectId) return;
      
      try {
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
          
          // Firebase 데이터 검증
          if (import.meta.env.DEV) {
            // 아이디어 로드 (상세 로그는 필요시에만 활성화)
            if (!ideaData.imageUrl) {
              console.warn(`⚠️ ${doc.id}에 imageUrl이 없습니다!`);
            }
          }
          
          ideasData.push(ideaData);
        });
        
        if (isMounted) {
          setItems(ideasData);
          if (import.meta.env.DEV) {
            console.log(`✅ 총 ${ideasData.length}개 아이디어 로드 완료`);
          }
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

  // ResultPage에서 돌아왔을 때 preservedDropItem 처리
  useEffect(() => {
    const preservedItem = location.state?.preservedDropItem;
    if (preservedItem) {
      // 보존된 아이템으로 드롭 상태 복원
      setDropped(true);
      setSelectedItem(preservedItem);
      // activatedId를 아이템 ID로 설정
      setActivatedId(preservedItem.id);
      
      // URL state에서 preservedDropItem 제거 (한 번만 처리)
      window.history.replaceState(
        { ...location.state, preservedDropItem: undefined },
        '',
        location.pathname
      );
    }
  }, [location.state?.preservedDropItem, items, location.pathname, location.state]);

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

  // 삭제 핸들러 (ItemList에 전달) - ID 기반으로 수정
  // ⚠️ 각 아이디어는 독립적이므로, 해당 아이디어와 그 experiments만 삭제
  // 다른 생성물들은 삭제하지 않음 (모든 실험 정보를 자체적으로 가지고 있으므로)
  const handleDeleteItem = async (itemId) => {
    if (!projectId || !itemId) return;
    
    const itemToDelete = items.find(item => item.id === itemId);
    if (!itemToDelete) {
      console.error('삭제할 아이템을 찾을 수 없습니다:', itemId);
      return;
    }
    
    try {
      console.log('🗑️ 아이디어 삭제 시작:', itemId);
      
      // 1️⃣ 해당 아이디어의 experiments 서브컬렉션 삭제
      const experimentsRef = collection(db, "projects", projectId, "ideas", itemId, "experiments");
      const experimentsSnapshot = await getDocs(experimentsRef);
      
      console.log(`📋 삭제할 실험 기록 수: ${experimentsSnapshot.size}`);
      
      const deleteExperimentPromises = experimentsSnapshot.docs.map(expDoc => 
        deleteDoc(doc(db, "projects", projectId, "ideas", itemId, "experiments", expDoc.id))
      );
      
      await Promise.all(deleteExperimentPromises);
      console.log('✅ 실험 기록 삭제 완료');
      
      // 2️⃣ 아이디어 문서 삭제
      await deleteDoc(doc(db, "projects", projectId, "ideas", itemId));
      
      console.log('✅ Firebase에서 아이디어 삭제 완료:', itemId);
      
      // 3️⃣ 로컬 state에서 제거
      setItems(prev => {
        const newArr = prev.filter(item => item.id !== itemId);
        
        // 현재 drop된 아이템이 삭제되거나, 모두 삭제되면 dropped 해제
        if (activatedId === itemId || newArr.length === 0) {
          setDropped(false);
          setActivatedId(null);
          setSelectedItem(null);
          setSelectedAdditive(null);
          setSliderValue(0);
          setSliderTouched(false);
          setReferenceImage(null);
          setImprovedProduct(null);
        }
        return newArr;
      });
    } catch (error) {
      console.error('❌ 아이디어 삭제 실패:', error);
      alert('아이디어 삭제 중 오류가 발생했습니다.');
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
      }
    },
    // drop 시 드롭된 item의 ID를 활성화
    drop: (item) => {
      const isNewItem = item.itemData?.id !== activatedId;
      
      // 새로운 아이템이거나 첫 번째 drop인 경우
      if (!dropped || isNewItem) {
        // 기존 활성화된 아이템이 있다면 비활성화
        if (activatedId !== null) {
          // 기존 아이템의 상태를 default로 변경하는 로직은 Sidebar에서 처리됨
        }
        
        setDropped(true);
        setIsItemOver(false);
        setActivatedId(item.itemData?.id || null);
        
        // 선택된 아이템 데이터 저장
        if (item.itemData) {
          // imageUrl 유효성 검증
          if (!item.itemData.imageUrl || typeof item.itemData.imageUrl !== 'string' || item.itemData.imageUrl.trim() === '') {
            console.error('⚠️ Firebase 데이터에서 imageUrl 찾을 수 없음:', {
              id: item.itemData.id,
              title: item.itemData.title,
              imageUrl: item.itemData.imageUrl,
              전체데이터: item.itemData
            });
            alert(`선택한 아이디어 "${item.itemData.title || 'Unknown'}"에 이미지 URL이 없습니다.\nFirebase에서 imageUrl 필드를 확인해주세요.`);
          }
          
          setSelectedItem(item.itemData);
          if (import.meta.env.DEV) {
            console.log('📋 아이템 드롭:', item.itemData.title, '| ImageURL 유효:', !!(item.itemData.imageUrl && item.itemData.imageUrl.trim()));
          }
        }
        
        // 새로운 아이템이 드롭되면 첨가제 관련 상태 초기화
        setSelectedAdditive(null);
        setSliderValue(0);
        setSliderTouched(false);
        setReferenceImage(null);
        setImprovedProduct(null);
      }
      
      return undefined;
    },
  });
  // isOver 값이 false가 되면(드래그 아웃) 가이드 복구
  useEffect(() => {
    if (!isOver) {
      setIsItemOver(false);
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
          activatedId={activatedId}
          setActivatedId={setActivatedId}
          onDeleteItem={handleDeleteItem}
          projectId={projectId}
          onDragStateChange={setIsDraggingItem}
          onItemSelect={handleItemSelect}
        />

        {/* 무대(Container) 위에 DropItem을 깔고, 그 위에 DropOverlay를 올림 */}
        <Stage $dropped={dropped}>
          {/* 드롭된 카드 또는 안내 화면 */}
          {dropped && selectedItem ? (
            <DropItem
              title={selectedItem.title}
              imageUrl={selectedItem.imageUrl}
              content={selectedItem.description}
              type={selectedItem.type === 'generated' ? 'result' : 'original'}
              additiveType={selectedItem.type === 'generated' ? selectedItem.additiveType : null}
              generation={calculateCurrentGeneration(selectedItem)}
              pageType="lab"
              onClear={handleClearSelection}
              loading={loading}
              loadingColor={selectedAdditive ? ADDITIVE_COLORS[selectedAdditive] : null}
              // 히스토리 버튼을 위한 데이터
              projectId={projectId}
              ideaId={selectedItem.id}
              sourceExperimentId={selectedItem.sourceExperimentId || null}
            />
          ) : (
            // 최초 상태의 안내 화면 (absolute positioned)
            <DropArea $dropped={dropped}>
              <img
                src={`/dragdrop.gif?${gifKey}`}
                alt="drag guide"
                style={{ width: 705, height: 330, marginBottom: 52, opacity: 0.8 }}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.gray[500], marginBottom: 16 }}>
                  아이디어 선택하기
                </div>
                <div style={{ fontSize: 20, fontWeight: 400, color: theme.colors.gray[400], lineHeight: 1.4 }}>
                  리스트에서 아이디어를 탭하거나 드래그하여 우측 영역에 드롭해주세요<br />
                  다른 아이디어를 고르고 싶다면, 새로운 아이디어를 드롭해주세요.
                </div>
              </div>
            </DropArea>
          )}

          {/* ✅ 항상 존재하는 드롭 오버레이: 드래그할 때만 활성화됨 */}
          <DropOverlay
            ref={drop}
            className={isOver ? 'hover' : ''}
            $active={isDraggingItem}          // 드래그 중에만 히트테스트 ON
            $dropped={dropped}
          >
            {/* 드래그 중에 보일 UI */}
            {isItemOver ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <Icons type={dropped ? "restart_alt" : "upload"} size={80} color={theme.colors.gray[400]} />
                {dropped && (
                  <div style={{ fontSize:16, fontWeight:500, color:theme.colors.gray[500], marginTop:12, textAlign:'center' }}>
                    아이디어 교체하기
                  </div>
                )}
              </div>
            ) : null}
          </DropOverlay>
        </Stage>

        {dropped && (
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
        )}
      </ContentWrap>
      {dropped && (
        <ActionBtn
          type={selectedAdditive && sliderTouched && !loading ? 'default' : 'disabled'}
          iconName="arrow_forward"
          title={loading ? "실험 중..." : "실험하기"}
          onClick={async () => {
            if (activatedId && selectedItem && selectedAdditive && sliderTouched && !loading) {
              try {
                setLoading(true);
                
                const currentIdea = selectedItem;
                
                // 카운터를 사용한 효율적인 실험 ID 생성
                const { id: experimentId } = await getNextIdWithCounter(
                  `counters/projects/${projectId}/ideas/${currentIdea.id}/experiments`, 
                  'exp'
                );
                
                if (import.meta.env.DEV) {
                  console.log('🔬 실험 시작:', experimentId, '| 첨가제:', selectedAdditive, '| 레퍼런스:', !!referenceImage);
                }
                
                // 실험 데이터 구조 - ResultPage와 일관된 구조로 수정
                const experimentData = {
                  id: experimentId,
                  ideaId: currentIdea.id,
                  projectId,
                  
                  // 실험 조건 정보 (플랫 구조)
                  additiveType: selectedAdditive,
                  additiveIntensity: sliderValue / 100,
                  
                  // 원본 아이디어 정보
                  originalIdea: {
                    title: currentIdea.title,
                    description: currentIdea.description,
                    imageUrl: currentIdea.imageUrl,
                    tags: currentIdea.tags || []
                  },
                  
                  // 실험 상태
                  status: 'processing', // 'processing' -> 'completed'
                  
                  // 타임스탬프 (ISO 문자열로 변환)
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                // 심미성 첨가제인 경우에만 레퍼런스 이미지 추가
                if (selectedAdditive === 'aesthetics' && referenceImage) {
                  experimentData.referenceImageUrl = referenceImage;
                  if (import.meta.env.DEV) {
                    console.log('레퍼런스 이미지 추가 완료');
                  }
                }
                
                if (import.meta.env.DEV) {
                  // 실험 데이터 생성 완료
                }
                
                // Firebase 저장은 ResultPage에서 처리 (실험 완료 시)
                console.log('� LabPage - 실험 ID 생성 완료, ResultPage로 전달 예정:', experimentId);
                
                // GPT API 호출로 실제 아이디어 생성
                try {
                  if (import.meta.env.DEV) {
                    console.log('GPT API 호출 시작...');
                  }
                  
                  // 이미 저장된 Vision 분석 결과 사용 (CanvasPage에서 저장됨)
                  const visionAnalysis = selectedItem?.visionAnalysis || '이미지 분석 결과가 없습니다.';
                  if (import.meta.env.DEV) {
                    console.log('저장된 Vision 분석 사용:', visionAnalysis.substring(0, 100) + '...');
                  }
                  
                  let referenceAnalysis = null;
                  // 심미성 첨가제이고 레퍼런스 이미지가 있는 경우 분석
                  if (selectedAdditive === 'aesthetics' && referenceImage) {
                    if (import.meta.env.DEV) {
                      console.log('레퍼런스 이미지 분석 중...');
                    }
                    referenceAnalysis = await analyzeReferenceImage(referenceImage);
                  }
                  
                  // GPT API로 아이디어 생성 (저장된 Vision 분석 사용)
                  const gptResponse = await analyzeIdea(
                    selectedAdditive,
                    selectedItem.title,        // 선택된 아이템의 제목
                    selectedItem.description,  // 선택된 아이템의 설명
                    visionAnalysis,            // 저장된 Vision 분석 결과 사용
                    referenceAnalysis,         // 레퍼런스 이미지 분석 (심미성만)
                    sliderValue               // 슬라이더 값
                  );
                  
                  if (import.meta.env.DEV) {
                    console.log('GPT API 응답:', gptResponse);
                  }
                  
                  // Step 1-4 인사이트를 바탕으로 개선된 제품 정보 생성
                  const improvedProduct = await improveProductInfo(
                    currentIdea.title,
                    currentIdea.description,
                    gptResponse.steps || [],
                    selectedAdditive,
                    visionAnalysis,                    // Vision 분석 결과
                    currentIdea.imageUrl,              // 원본 아이디어 이미지 URL
                    selectedAdditive === 'aesthetics' ? referenceImage : null,  // 레퍼런스 이미지 (심미성만)
                    sliderValue                        // 슬라이더 값 (0: 많이 변형, 1: 적당히, 2: 조금 변형)
                  );
                  
                  if (import.meta.env.DEV) {
                    console.log('개선된 제품 정보:', improvedProduct);
                  }
                  
                  // 개선된 제품 정보를 상태에 저장하여 DropItem에 반영
                  setImprovedProduct(improvedProduct);
                  
                  // GPT 응답을 결과 형태로 변환
                  const finalGptResponse = {
                    title: improvedProduct.title,
                    description: improvedProduct.description,
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
                      sourceImageUrl: currentIdea.imageUrl, // 🔥 실험 대상 이미지 URL 전달
                      additiveType: selectedAdditive,
                      additiveIntensity: sliderValue,
                      referenceImage: selectedAdditive === 'aesthetics' ? referenceImage : null,
                      visionAnalysis: visionAnalysis, // Vision API 분석 결과 전달
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

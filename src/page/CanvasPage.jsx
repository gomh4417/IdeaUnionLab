// CanvasPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextIdWithCounter } from '../utils/firebaseCounter';
import {
  generateProductTag,
  generateRandomIdea,
  generateImageWithStability,
} from '../utils/Aiapi';
import { uploadCanvasImage, uploadIflImage } from '../utils/firebaseStorage';
import { getRecentUploadedImages } from '../utils/firebaseUpload';
import styled from 'styled-components';
import { theme } from '../styles/theme';

import Header from '../jsx/Header';
import ActionBtn from '../jsx/ActionBtn';

import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Icons from '../jsx/Icons';

const inputShadow = '0px 4px 8px rgba(0,0,0,0.05)';

// 로딩 스피너 애니메이션
const GlobalStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = GlobalStyle;
  document.head.appendChild(style);
}

const Container = styled.div`
  width: 1920px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const OuterWrap = styled.div`
  padding: 25px 32px 32px 32px;
  min-height: 100vh;
  background: ${theme.colors.gray[50] || '#f8f9fa'};
`;

const MainLayout = styled.div`
  display: flex;
  flex-direction: row;
  gap: 24px;
  margin-top: 40px;
`;

const LeftCon = styled.div`
  width: 480px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const RightCon = styled.div`
  flex: 1;
  background: ${theme.colors.gray[100]};
  border-radius: ${theme.radius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 1348px;
  height: calc(1348px * 9 / 16);
  
  /* 터치 스크롤 방지 (애플펜슬 사용 시) */
  touch-action: none;
`;

const TitleInput = styled.input.attrs({ maxLength: 50 })`
  width: 100%;
  height: 68px;
  border-radius: ${theme.radius.small};
  border: none;
  outline: none;
  padding: 14px 18px;
  font-size: 18px;
  font-weight: 400;
  font-family: 'Pretendard', sans-serif;
  color: ${({ $hasValue }) =>
    $hasValue ? theme.colors.gray[900] : theme.colors.gray[500]};
  background: #fff;
  border-bottom: 2px solid ${theme.colors.primary};
  box-shadow: ${inputShadow};
  &:focus {
    box-shadow: ${theme.shadow};
    transition: all 0.2s ease-in-out;
    border-bottom: 3px solid ${theme.colors.primary};
  }
`;

const ContentInput = styled.textarea`
  width: 100%;
  height: 666px;
  border-radius: ${theme.radius.small};
  border: none;
  outline: none;
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 300;
  font-family: 'Pretendard', sans-serif;
  color: ${({ $hasValue }) =>
    $hasValue ? theme.colors.gray[900] : theme.colors.gray[500]};
  background: #fff;
  border-bottom: 2px solid ${theme.colors.primary};
  resize: none;
  box-shadow: ${inputShadow};
  &:focus {
    box-shadow: ${theme.shadow};
    transition: all 0.2s ease-in-out;
    border-bottom: 3px solid ${theme.colors.primary};
  }
`;

const ToolBarWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px;
  border-radius: ${theme.radius.max};
  background: #fff;
  box-shadow: ${inputShadow};
  width: fit-content;
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
`;

const ToolbarBtn = styled.button`
  background: ${({ $active }) =>
    $active ? theme.colors.secondary : 'transparent'};
  border: none;
  outline: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${({ $active }) => ($active ? theme.shadow : 'none')};
  transition: background 0.2s, box-shadow 0.2s;
  padding: 0;
  position: relative;
`;

const IflPromptContainer = styled.div`
  position: absolute;
  bottom: 68px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 60px;
  border-radius: ${theme.radius.max};
  border: 1px solid ${theme.colors.primary};
  background: #fff;
  box-shadow: ${theme.shadow};
  z-index: 1000;
  display: flex;
  align-items: center;
  overflow: hidden;
`;

const IflPromptInput = styled.input`
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 16px;
  font-size: 14px;
  font-family: 'Pretendard', sans-serif;
  background: transparent;
  &::placeholder {
    color: ${theme.colors.gray[400]};
  }
`;

const IflGenerateBtn = styled.button`
  height: 100%;
  background: ${theme.colors.primary};
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 8px;
  border: none;
  outline: none;
  border-radius: ${theme.radius.max};
  cursor: pointer;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  justify-content: center;
  height: calc(100% - 16px);
  display: flex;
  align-items: center;
  &:hover { background: ${theme.colors.primary}dd; }
  &:disabled { background: ${theme.colors.gray[400]}; cursor: not-allowed; }
`;

// 펜/지우개 굵기 조절 슬라이더 컨테이너
const WidthSliderContainer = styled.div`
  position: absolute;
  bottom: 68px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 44px;
  border-radius: ${theme.radius.max};
  border: 1px solid ${theme.colors.primary};
  background: #fff;
  box-shadow: ${theme.shadow};
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 2px;
`;

const WidthSlider = styled.input.attrs({ type: 'range' })`
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: ${theme.colors.gray[300]};
  border-radius: 2px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${theme.colors.primary};
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${theme.colors.primary};
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const WidthIndicator = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.gray[900]};
  min-width: 32px;
  margin-left: -8px;
  text-align: center;
  font-family: 'Pretendard', sans-serif;
`;

// 이미지 선택 모달 (SaveSuccessOverlay와 동일한 스타일)
const ImageSelectOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #00000040;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ImageSelectModal = styled.div`
  background: #ffffff;
  backdrop-filter: blur(10px);
  border-radius: ${theme.radius.large};
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 800px;
  min-height: 400px;
  width: 100%;
`;

const ModalTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${theme.colors.gray[900]};
  font-family: 'Pretendard', sans-serif;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 140px);
  gap: 12px;
  width: 100%;
  justify-content: center;
`;

const ImageItem = styled.div`
  width: 140px;
  height: 140px;
  border-radius: ${theme.radius.small};
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #eee;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${theme.colors.primary};
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CloseButton = styled.button`
  background: ${theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${theme.radius.max};
  padding: 10px 24px;
  font-size: 18px;
  font-weight: 600;
  font-family: 'Pretendard', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  position: absolute;
  bottom: 24px;
  
  &:hover {
    background: ${theme.colors.gray[300]};
  }
`;

const EmptyMessage = styled.div`
  font-size: 14px;
  color: ${theme.colors.gray[500]};
  font-family: 'Pretendard', sans-serif;
  text-align: center;
  padding: 40px 20px;
`;

const TOOLBAR_ICONS = [
  { type: 'pen', key: 'pen' },
  { type: 'eraser', key: 'eraser' },
  { type: 'image', key: 'image' },
  { type: 'ifl', key: 'ifl' },
  { type: 'undo', key: 'undo' },
];

function CanvasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const projectId = location.state?.projectId;

  useEffect(() => {
    if (!projectId) {
      alert('프로젝트 정보가 없습니다. 홈화면에서 다시 시작해주세요.');
      navigate('/');
    }
  }, [projectId, navigate]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTool, setActiveTool] = useState('pen');

  // IFL
  const [showIflInput, setShowIflInput] = useState(false);
  const [iflPrompt, setIflPrompt] = useState('');
  const [iflLoading, setIflLoading] = useState(false);

  // 펜/지우개 굵기 조절
  const [showWidthSlider, setShowWidthSlider] = useState(false);
  const [penWidth, setPenWidth] = useState(8);

  const [penColor] = useState('#131313');

  // 이미지 선택 모달
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // 캔버스에 그릴 이미지: 항상 data URL을 유지 (tainted 방지)
  const [imageUrl, setImageUrl] = useState(null);

  const [stageKey, setStageKey] = useState(0);
  const fileInputRef = useRef();
  const stageRef = useRef();

  // crossOrigin 'anonymous' 설정
  const [konvaImage, status] = useImage(imageUrl || undefined, 'anonymous');
  
  // 이미지 크기 및 위치 계산 (비율 유지)
  const [imageProps, setImageProps] = useState({ x: 0, y: 0, width: 1348, height: 832 });
  
  // 이미지 로딩 상태 모니터링 및 비율 계산
  useEffect(() => {
    if (imageUrl) {
      console.log('🖼️ 이미지 URL 변경됨:', imageUrl.substring(0, 50) + '...');
      console.log('🖼️ Konva 이미지 로딩 상태:', status);
      console.log('🖼️ Konva 이미지 객체:', konvaImage ? '로드됨' : '로드되지 않음');
    }
    
    if (konvaImage) {
      const canvasWidth = 1348;
      const canvasHeight = `calc(1348px * 9 / 16)`;
      const imgWidth = konvaImage.width;
      const imgHeight = konvaImage.height;
      
      // 이미지 비율 계산
      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = canvasWidth / canvasHeight;
      
      let newWidth, newHeight, x, y;
      
      if (imgRatio > canvasRatio) {
        // 이미지가 캔버스보다 가로로 더 넓음 → width 기준으로 맞춤
        newWidth = canvasWidth;
        newHeight = canvasWidth / imgRatio;
        x = 0;
        y = (canvasHeight - newHeight) / 2;
      } else {
        // 이미지가 캔버스보다 세로로 더 김 → height 기준으로 맞춤
        newHeight = canvasHeight;
        newWidth = canvasHeight * imgRatio;
        x = (canvasWidth - newWidth) / 2;
        y = 0;
      }
      
      setImageProps({ x, y, width: newWidth, height: newHeight });
      console.log('📐 이미지 비율:', imgRatio, '캔버스 비율:', canvasRatio);
      console.log('📏 조정된 크기:', { width: newWidth, height: newHeight, x, y });
    }
  }, [imageUrl, status, konvaImage]);

  /** 외부/로컬 이미지를 data URL로 변환 */
  const toDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const fetchToDataUrl = async (url) => {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('이미지 가져오기에 실패했습니다.');
    const blob = await res.blob();
    return toDataUrl(blob);
  };

  // 캔버스 이미지를 dataURL로 추출
  const getCanvasImageUrl = () => {
    try {
      const stage = stageRef.current;
      if (!stage) return null;
      const w = stage.width();
      const h = stage.height();
      if (!w || !h) return null;

      let dataURL = null;
      try {
        dataURL = stage.toDataURL();
      } catch {
        dataURL = stage.toDataURL({
          mimeType: 'image/png',
          quality: 1,
          pixelRatio: 1,
        });
      }
      if (!dataURL || dataURL.length < 100) return null;
      return dataURL;
    } catch (e) {
      console.error('캔버스 이미지 생성 예외:', e);
      return null;
    }
  };

  // 드로잉 핸들러 (마우스 + 터치 통합)
  const handleDrawStart = (e) => {
    if (activeTool === 'pen' || activeTool === 'eraser') {
      setIsDrawing(true);
      setShowWidthSlider(false); // 그림 그리기 시작하면 슬라이더 닫기
      const pos = e.target.getStage().getPointerPosition();
      setLines((prev) => [
        ...prev,
        {
          tool: activeTool,
          points: [pos.x, pos.y],
          color: activeTool === 'eraser' ? '#fff' : penColor,
          width: penWidth,
        },
      ]);
    }
  };
  
  const handleDrawMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    const newPoints = [...lastLine.points, point.x, point.y];
    setLines([...lines.slice(0, -1), { ...lastLine, points: newPoints }]);
  };
  
  const handleDrawEnd = () => setIsDrawing(false);

  // 파일 업로드 → data URL로 변환
  const handleAddImg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toDataUrl(file).then(setImageUrl).catch(console.error);
  };

  const handleReplay = () => {
    setLines([]);
    setImageUrl(null);
    setStageKey((k) => k + 1);
  };

  const handleToolbarClick = async (type) => {
    if (type === 'image') {
      // 전시용(모달) 대신: PC 파일 탐색기 열기 (png/jpg)
      setShowIflInput(false);
      setShowWidthSlider(false);
      fileInputRef.current?.click();

      // (전시용) Firebase Storage 이미지 모달 열기 기능은 유지하되 비활성화
      // setShowImageModal(true);
      // const images = await getRecentUploadedImages();
      // setUploadedImages(images);
    }
    else if (type === 'undo') {
      handleReplay();
      setShowIflInput(false);
      setShowWidthSlider(false);
    }
    else if (type === 'ifl') {
      setShowIflInput(true);
      setShowWidthSlider(false);
      setActiveTool(type);
    }
    else if (type === 'pen' || type === 'eraser') {
      setShowWidthSlider(true);
      setShowIflInput(false);
      setActiveTool(type);
    }
    else {
      setActiveTool(type);
      setShowIflInput(false);
      setShowWidthSlider(false);
    }
  };

  // 이미지 선택 처리
  const handleImageSelect = async (imageUrl) => {
    try {
      console.log('🖼️ 선택한 이미지:', imageUrl);
      // Firebase Storage URL을 data URL로 변환
      const dataUrl = await fetchToDataUrl(imageUrl);
      setImageUrl(dataUrl);
      setShowImageModal(false);
    } catch (error) {
      console.error('❌ 이미지 로드 실패:', error);
      alert('이미지를 불러오는데 실패했습니다.');
    }
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setUploadedImages([]);
  };

  // IFL 프롬프트 처리
  const handleIflSubmit = async () => {
    if (!iflPrompt.trim() || iflLoading) return;
    try {
      setIflLoading(true);
      console.log('IFL 아이디어 생성 시작:', iflPrompt);
      
      // 1단계: GPT로 아이디어 생성
      const ideaData = await generateRandomIdea(iflPrompt);
      console.log('아이디어 생성 완료:', ideaData.title);
      setTitle(ideaData.title);
      setContent(ideaData.description);

      // 2단계: Stability AI로 고품질 제품 렌더링 생성
      try {
        console.log('🖼️ 제품 렌더링 생성 시작...');
        console.log('프롬프트:', ideaData.imagePrompt.substring(0, 100) + '...');
        
        const url = await generateImageWithStability(ideaData.imagePrompt);
        console.log('🔍 Stability API 반환값 타입:', typeof url);
        console.log('🔍 URL 시작 부분:', url ? url.substring(0, 50) + '...' : 'null');
        
        const dataUrl = url.startsWith('http')
          ? await fetchToDataUrl(url)
          : url;
        
        console.log('🔍 최종 dataUrl 타입:', typeof dataUrl);
        console.log('🔍 dataUrl 유효성:', dataUrl && dataUrl.length > 100 ? '유효함' : '무효함');
        
        // 이미지 유효성 검증
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          setImageUrl(dataUrl);
          console.log('✅ 제품 렌더링 생성 완료, 이미지 URL 설정됨');
          
          // Base64 이미지 테스트용 - 브라우저에서 확인 가능
          const testImg = new Image();
          testImg.onload = () => console.log('✅ Base64 이미지 로드 성공');
          testImg.onerror = (err) => console.error('❌ Base64 이미지 로드 실패:', err);
          testImg.src = dataUrl;
        } else {
          console.error('❌ 유효하지 않은 이미지 데이터:', dataUrl?.substring(0, 100));
        }
      } catch (imgErr) {
        console.error('❌ 제품 렌더링 생성 실패:', imgErr);
        console.error('❌ 에러 상세:', imgErr.message);
        alert(`제품 이미지 생성에 실패했습니다.\n오류: ${imgErr.message}\n\n텍스트 아이디어는 정상적으로 생성되었습니다.`);
      }

      setShowIflInput(false);
      setIflPrompt('');
      setActiveTool('pen');
      setShowWidthSlider(true);  // 펜 도구로 돌아가면서 굵기 슬라이더 표시
    } catch (e) {
      console.error('❌ IFL 생성 실패:', e);
      alert(`아이디어 생성 중 오류가 발생했습니다: ${e.message}`);
    } finally {
      setIflLoading(false);
    }
  };

  const handleIflCancel = () => {
    setShowIflInput(false);
    setIflPrompt('');
    setActiveTool('pen');
  };

  return (
    <OuterWrap>
      <Container>
        <Header
          type="back"
          onClick={() => navigate('/lab', { state: { projectId } })}
        >
          공공디자인 아이디어
        </Header>

        <MainLayout>
          <LeftCon>
            <TitleInput
              placeholder="Title Input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              $hasValue={!!title}
            />
            <ContentInput
              placeholder="Content Input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              $hasValue={!!content}
            />
          </LeftCon>

          <RightCon>
            <div
              style={{
                width: 1348,
                height: 832,
                background: '#fff',
                borderRadius: theme.radius.small,
                boxShadow: inputShadow,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <Stage
                width={1348}
                height={832}
                key={stageKey}
                ref={stageRef}
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
                onMouseUp={handleDrawEnd}
                onTouchStart={handleDrawStart}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleDrawEnd}
                style={{ width: 804, height: 623, touchAction: 'none' }}
              >
                {/* 이미지 레이어 (지우개 영향 X) */}
                <Layer listening={false}>
                  {imageUrl && konvaImage ? (
                    <KonvaImage 
                      image={konvaImage} 
                      x={imageProps.x} 
                      y={imageProps.y} 
                      width={imageProps.width} 
                      height={imageProps.height} 
                    />
                  ) : imageUrl && !konvaImage ? (
                    console.log('이미지 URL은 있지만 Konva 이미지가 로드되지 않음') || null
                  ) : null}
                </Layer>

                {/* 드로잉 레이어 */}
                <Layer>
                  {lines.map((line, i) => (
                    <Line
                      key={i}
                      points={line.points}
                      stroke={line.color}
                      strokeWidth={line.width}
                      tension={0.5}
                      lineCap="round"
                      globalCompositeOperation={
                        line.tool === 'eraser' ? 'destination-out' : 'source-over'
                      }
                    />
                  ))}
                </Layer>
              </Stage>

              {/* 가이드/로딩 */}
              {!imageUrl && lines.length === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.gray[400],
                    pointerEvents: 'none',
                    width: '100%',
                    gap: '4px',
                  }}
                >
                  {iflLoading ? (
                    <>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          border: `3px solid ${theme.colors.gray[200]}`,
                          borderTop: `3px solid ${theme.colors.primary}`,
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          marginBottom: 24,
                        }}
                      />
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 500,
                          color: theme.colors.primary,
                          marginBottom: 4,
                        }}
                      >
                        AI가 아이디어를 생성하고 있습니다
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 300,
                          color: theme.colors.gray[400],
                        }}
                      >
                        잠시만 기다려주세요. 텍스트와 이미지를 생성중입니다...
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src="/draw.svg"
                        alt="guide"
                        width={400}
                        height={240}
                        style={{ marginBottom: 52, opacity: 0.5 }}
                      />
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 600,
                          color: theme.colors.gray[500],
                          marginBottom: 16,
                        }}
                      >
                        아이디어 작성하기
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 400,
                          color: theme.colors.gray[400],
                        }}
                      >
                        하단의 도구를 활용하여 아이디어를 그림이나 이미지로 표현해주세요!
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 이미지 업로드 input */}
              <input
                type="file"
                accept="image/png, image/jpeg"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAddImg}
              />
            </div>
          </RightCon>
        </MainLayout>

        {/* 하단 툴바 */}
        <ToolBarWrap>
          {TOOLBAR_ICONS.map(({ type, key }) => (
            <ToolbarBtn
              key={key}
              $active={activeTool === type}
              onClick={() => handleToolbarClick(type)}
              aria-label={type}
            >
              <Icons type={type} size={28} color={activeTool === type ? '#222' : '#aaa'} />

              {/* IFL 입력창 */}
              {type === 'ifl' && showIflInput && (
                <IflPromptContainer>
                  <IflPromptInput
                    type="text"
                    value={iflPrompt}
                    onChange={(e) => setIflPrompt(e.target.value)}
                    placeholder={iflLoading ? '생성 중...' : 'ex)스마트 책상, 마우스'}
                    disabled={iflLoading}
                    autoFocus
                    onBlur={(e) => {
                      if (!e.relatedTarget || !e.relatedTarget.closest('.ifl-container')) {
                        setTimeout(() => handleIflCancel(), 100);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Escape' && handleIflCancel()}
                  />
                  <IflGenerateBtn
                    type="button"
                    onClick={handleIflSubmit}
                    disabled={iflLoading || !iflPrompt.trim()}
                    className="ifl-container"
                  >
                    {iflLoading ? '생성중' : '생성'}
                  </IflGenerateBtn>
                </IflPromptContainer>
              )}
              
              {/* 펜/지우개 굵기 조절 슬라이더 */}
              {(type === 'pen' || type === 'eraser') && showWidthSlider && activeTool === type && (
                <WidthSliderContainer
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <WidthIndicator>{penWidth}</WidthIndicator>
                  <WidthSlider
                    min="2"
                    max="30"
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                  />
                </WidthSliderContainer>
              )}
            </ToolbarBtn>
          ))}
        </ToolBarWrap>

        <ActionBtn
          type={loading ? 'disabled' : 'default'}
          iconName="add"
          title={loading ? '저장 중...' : '추가하기'}
          onClick={async () => {
            // 입력 검증
            if (!title.trim()) {
              alert('제목을 입력해주세요!');
              return;
            }
            if (!content.trim()) {
              alert('내용을 입력해주세요!');
              return;
            }
            const isCanvasEmpty = (!lines || lines.length === 0) && !imageUrl;
            if (isCanvasEmpty) {
              alert('캔버스에 그림을 그리거나 이미지를 추가해주세요!');
              return;
            }
            if (!stageRef.current) {
              alert('캔버스가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
              return;
            }
            if (!projectId) {
              alert('프로젝트 정보가 없습니다. 홈화면에서 다시 시작해주세요.');
              navigate('/');
              return;
            }

            try {
              setLoading(true);

              // 1) 캔버스 → dataURL
              let canvasImageUrl = null;
              try {
                await new Promise((r) => setTimeout(r, 200));
                canvasImageUrl = getCanvasImageUrl();
              } catch (e) {
                console.error('캔버스 이미지 생성 실패:', e);
              }

              // 2) 제품 태그 생성 (Vision API 없이 제목과 내용만으로)
              let productTag = '#생활용품';
              try {
                productTag = await generateProductTag(
                  '', // visionAnalysis는 빈 문자열로 전달
                  title,
                  content
                );
              } catch {
                productTag = '#생활용품';
              }

              // 3) 새로운 아이디어 ID 생성 (idea_0xx 형식)
              const ideasRef = collection(db, 'projects', projectId, 'ideas');
              const ideasSnapshot = await getDocs(ideasRef);
              const existingIds = ideasSnapshot.docs.map(d => d.id);
              
              // idea_0xx 형식으로 ID 생성
              let ideaId = null;
              for (let i = 1; i <= 999; i++) {
                const candidateId = `idea_${String(i).padStart(3, '0')}`;
                if (!existingIds.includes(candidateId)) {
                  ideaId = candidateId;
                  break;
                }
              }

              if (!ideaId) {
                throw new Error('새로운 아이디어 ID를 생성할 수 없습니다.');
              }

              console.log('✅ 생성된 아이디어 ID:', ideaId);

              // 4) 이미지 업로드 (단일 try…catch로 정리)
              let finalImageUrl = null;
              try {
                if (canvasImageUrl) {
                  finalImageUrl = await uploadCanvasImage(
                    canvasImageUrl,
                    projectId,
                    ideaId
                  );
                } else if (imageUrl) {
                  if (imageUrl.startsWith('data:')) {
                    finalImageUrl = await uploadCanvasImage(
                      imageUrl,
                      projectId,
                      ideaId
                    );
                  } else if (imageUrl.startsWith('http')) {
                    finalImageUrl = await uploadIflImage(
                      imageUrl,
                      projectId,
                      ideaId
                    );
                  }
                }
              } catch (uploadErr) {
                console.error('이미지 업로드 실패:', uploadErr);
                // 업로드 실패해도 저장은 진행
              }

              // 5) Vision API로 이미지 분석 (LabPage에서 사용할 예정)
              let visionAnalysisResult = null;
              if (finalImageUrl) {
                try {
                  console.log('Vision API로 이미지 분석 중...');
                  const { analyzeImageWithVision } = await import('../utils/Aiapi');
                  visionAnalysisResult = await analyzeImageWithVision(finalImageUrl);
                  console.log('Vision API 분석 완료:', visionAnalysisResult.substring(0, 100) + '...');
                } catch (visionError) {
                  console.warn('Vision API 분석 실패:', visionError);
                  visionAnalysisResult = '이미지 분석에 실패했습니다.';
                }
              }

              // 6) Firestore 저장
              const ideaData = {
                id: ideaId,
                title: title || '제목 없음',
                description: content || '설명 없음',
                imageUrl: finalImageUrl || '',
                visionAnalysis: visionAnalysisResult || '', // null/undefined 방지
                tags: [productTag],
                type: 'original',
                createdAt: new Date().toISOString(), // ISO 문자열로 변환
                updatedAt: new Date().toISOString()
              };
              
              console.log('💾 Firestore 저장 시작:', ideaData);
              await setDoc(doc(db, 'projects', projectId, 'ideas', ideaId), ideaData);
              console.log('✅ Firestore 저장 완료:', ideaId);

              // 완료
              navigate('/lab', { state: { projectId } });
            } catch (error) {
              console.error('아이디어 저장 실패:', error);
              alert(`아이디어 저장 중 오류가 발생했습니다: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }}
          style={{ position: 'absolute', right: 32, bottom: 36 }}
          disabled={loading}
        />
      </Container>

      {/* 이미지 선택 모달 */}
      {showImageModal && (
        <ImageSelectOverlay onClick={handleCloseImageModal}>
          <ImageSelectModal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>레퍼런스 이미지 선택</ModalTitle>
            
            {uploadedImages.length > 0 ? (
              <ImageGrid>
                {uploadedImages.map((img, index) => (
                  <ImageItem
                    key={index}
                    onClick={() => handleImageSelect(img.url)}
                    title={img.name}
                  >
                    <img src={img.url} alt={`업로드 이미지 ${index + 1}`} />
                  </ImageItem>
                ))}
              </ImageGrid>
            ) : (
              <EmptyMessage>
                아직 업로드된 이미지가 없습니다.<br />
                upload.html 페이지에서 이미지를 업로드해주세요.
              </EmptyMessage>
            )}
            
            <CloseButton onClick={handleCloseImageModal}>닫기</CloseButton>
          </ImageSelectModal>
        </ImageSelectOverlay>
      )}
    </OuterWrap>
  );
}

export default CanvasPage;

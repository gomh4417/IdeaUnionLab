// CanvasPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextIdWithCounter } from '../utils/firebaseCounter';
import {
  generateProductTag,
  generateRandomIdea,
  generateImage,
} from '../utils/Aiapi';
import { uploadCanvasImage, uploadIflImage } from '../utils/firebaseStorage';
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
  width: 1200px;
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
  margin-top: 20px;
`;

const LeftCon = styled.div`
  width: 298px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const RightCon = styled.div`
  flex: 1;
  max-width: 804px;
  max-height: 623px;
  background: ${theme.colors.gray[100]};
  border-radius: ${theme.radius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
`;

const TitleInput = styled.input.attrs({ maxLength: 50 })`
  width: 100%;
  height: 60px;
  border-radius: ${theme.radius.small};
  border: none;
  outline: none;
  padding: 12px;
  font-size: 16px;
  font-weight: 400;
  font-family: 'Pretendard', sans-serif;
  color: ${({ $hasValue }) =>
    $hasValue ? theme.colors.gray[900] : theme.colors.gray[500]};
  background: #fff;
  border-bottom: 1px solid ${theme.colors.primary};
  box-shadow: ${inputShadow};
  &:focus {
    box-shadow: ${theme.shadow};
    transition: all 0.2s ease-in-out;
    border-bottom: 2px solid ${theme.colors.primary};
  }
`;

const ContentInput = styled.textarea`
  width: 100%;
  height: 539px;
  border-radius: ${theme.radius.small};
  border: none;
  outline: none;
  padding: 12px;
  font-size: 14px;
  font-weight: 300;
  font-family: 'Pretendard', sans-serif;
  color: ${({ $hasValue }) =>
    $hasValue ? theme.colors.gray[900] : theme.colors.gray[500]};
  background: #fff;
  border-bottom: 1px solid ${theme.colors.primary};
  resize: none;
  box-shadow: ${inputShadow};
  &:focus {
    box-shadow: ${theme.shadow};
    transition: all 0.2s ease-in-out;
    border-bottom: 2px solid ${theme.colors.primary};
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
  margin: 0 auto;
  margin-top: 20px;
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
  width: 200px;
  height: 44px;
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
  padding: 0 20px;
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
  height: calc(100% - 16px);
  display: flex;
  align-items: center;
  &:hover { background: ${theme.colors.primary}dd; }
  &:disabled { background: ${theme.colors.gray[400]}; cursor: not-allowed; }
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

  const [penColor] = useState('#131313');
  const [penWidth] = useState(8);

  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // 캔버스에 그릴 이미지: 항상 data URL을 유지 (tainted 방지)
  const [imageUrl, setImageUrl] = useState(null);

  const [stageKey, setStageKey] = useState(0);
  const fileInputRef = useRef();
  const stageRef = useRef();

  // crossOrigin 'anonymous' 설정
  const [konvaImage] = useImage(imageUrl || undefined, 'anonymous');

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

  // 드로잉 핸들러
  const handleMouseDown = (e) => {
    if (activeTool === 'pen' || activeTool === 'eraser') {
      setIsDrawing(true);
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
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    const newPoints = [...lastLine.points, point.x, point.y];
    setLines([...lines.slice(0, -1), { ...lastLine, points: newPoints }]);
  };
  const handleMouseUp = () => setIsDrawing(false);

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

  const handleToolbarClick = (type) => {
    if (type === 'image') fileInputRef.current.click();
    else if (type === 'undo') handleReplay();
    else if (type === 'ifl') {
      setShowIflInput(true);
      setActiveTool(type);
    } else setActiveTool(type);
  };

  // IFL 프롬프트 처리
  const handleIflSubmit = async () => {
    if (!iflPrompt.trim() || iflLoading) return;
    try {
      setIflLoading(true);
      const ideaData = await generateRandomIdea(iflPrompt);
      setTitle(ideaData.title);
      setContent(ideaData.description);

      // DALL·E가 반환하는 외부 URL → fetch 후 data URL로 변환
      try {
        const url = await generateImage(ideaData.imagePrompt);
        const dataUrl = url.startsWith('http')
          ? await fetchToDataUrl(url)
          : url;
        setImageUrl(dataUrl);
      } catch (imgErr) {
        console.error('IFL 이미지 생성/변환 실패:', imgErr);
      }

      setShowIflInput(false);
      setIflPrompt('');
      setActiveTool('pen');
    } catch (e) {
      console.error('IFL 생성 실패:', e);
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
                width: 804,
                height: 623,
                background: '#fff',
                borderRadius: theme.radius.small,
                boxShadow: inputShadow,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <Stage
                width={804}
                height={623}
                key={stageKey}
                ref={stageRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}  // ← 카멜케이스
                onMouseUp={handleMouseUp}      // ← 카멜케이스
                style={{ width: 804, height: 623 }}
              >
                {/* 이미지 레이어 (지우개 영향 X) */}
                <Layer listening={false}>
                  {imageUrl && (
                    <KonvaImage image={konvaImage} x={0} y={0} width={804} height={623} />
                  )}
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
                        width={275}
                        height={186}
                        style={{ marginBottom: 24, opacity: 0.5 }}
                      />
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 500,
                          color: theme.colors.gray[500],
                          marginBottom: 4,
                        }}
                      >
                        아이디어 작성하기
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 300,
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
                    placeholder={iflLoading ? '생성 중...' : '예: 의자 디자인'}
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

              // 3) 새로운 아이디어 ID
              const { id: ideaId } = await getNextIdWithCounter(
                `counters/projects/${projectId}/ideas`,
                'idea'
              );

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

              // 5) Firestore 저장
              const ideaData = {
                id: ideaId,
                title: title || '제목 없음',
                description: content || '설명 없음',
                imageUrl: finalImageUrl || null,
                visionAnalysis: null, // Vision API 호출 안함으로 null 저장
                tags: [productTag],
                type: 'original',
                createdAt: new Date(),
              };
              await setDoc(doc(db, 'projects', projectId, 'ideas', ideaId), ideaData);

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
    </OuterWrap>
  );
}

export default CanvasPage;

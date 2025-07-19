import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';

import Header from '../jsx/Header';

import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

const ICON_SVGS = {
  pen: '/pen.svg',
  eraser: '/eraser.svg',
  image: '/addImg.svg',
  dots: '/random.svg',
  undo: '/replay.svg',
};

const inputShadow = '0px 4px 8px rgba(0,0,0,0.05)';

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
  background: ${theme.colors.gray[100]};
  border-radius: ${theme.radius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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
  color: ${({ $hasValue }) => $hasValue ? theme.colors.gray[900] : theme.colors.gray[500]};
  background: #fff;
  border-bottom: 1px solid ${theme.colors.primary};
  box-shadow: ${inputShadow};
  &:focus {
    box-shadow: ${theme.shadow};
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
  color: ${({ $hasValue }) => $hasValue ? theme.colors.gray[900] : theme.colors.gray[500]};
  background: #fff;
  border-bottom: 1px solid ${theme.colors.primary};
  resize: none;
  box-shadow: ${inputShadow};
  &:focus {
    box-shadow: ${theme.shadow};
  }
`;

const BottomCon = styled.div`
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
  background: ${({ $active }) => $active ? theme.colors.secondary : 'transparent'};
  border: none;
  outline: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${({ $active }) => $active ? theme.shadow : 'none'};
  transition: background 0.2s, box-shadow 0.2s;
  padding: 0;
`;

const TOOLBAR_ICONS = [
  { type: 'pen', key: 'pen' },
  { type: 'eraser', key: 'eraser' },
  { type: 'image', key: 'image' },
  { type: 'dots', key: 'dots' },
  { type: 'undo', key: 'undo' },
];

const PEN_COLORS = ['#222', '#FF6B6B', '#4D96FF', '#12B886']; // 펜 색상 옵션
const PEN_WIDTHS = [2, 4, 6, 8]; // 펜 굵기 옵션

function CanvasPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTool, setActiveTool] = useState('pen');

  const [penColor] = useState('#222'); // ✍️ 기본 펜 색상, 여기서 바꿀 수 있음
  const [penWidth] = useState(3);      // ✍️ 기본 펜 굵기, 여기서 바꿀 수 있음

  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [showImageControls, setShowImageControls] = useState(false);
  const [stageKey, setStageKey] = useState(0);
  const fileInputRef = useRef();
  const stageRef = useRef();
  const [konvaImage] = useImage(imageUrl);

  const handleMouseDown = (e) => {
    if (activeTool === 'pen' || activeTool === 'eraser') {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      setLines(prevLines => [
        ...prevLines,
        {
          tool: activeTool,
          points: [pos.x, pos.y],
          color: activeTool === 'eraser' ? '#fff' : penColor, // ✍️ 펜 색상 적용 위치
          width: penWidth,                                    // ✍️ 펜 굵기 적용 위치
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

  const handleAddImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setShowImageControls(true);
  };

  const handleReplay = () => {
    setLines([]);
    setImageUrl(null);
    setShowImageControls(false);
    setStageKey(k => k + 1);
  };

  const handleToolbarClick = (type) => {
    if (type === 'image') fileInputRef.current.click();
    else if (type === 'undo') handleReplay();
    else setActiveTool(type);
  };

  return (
    <OuterWrap>
      <Container>
        <Header type="back" onClick={() => navigate('/lab')}>공공디자인 아이디어</Header>
        <MainLayout>
          <LeftCon>
            <TitleInput
              placeholder="Title Input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              $hasValue={!!title}
            />
            <ContentInput
              placeholder="Content Input"
              value={content}
              onChange={e => setContent(e.target.value)}
              $hasValue={!!content}
            />
          </LeftCon>

          <RightCon>
            <div style={{ width: 804, height: 623, background: '#fff', borderRadius: theme.radius.small, boxShadow: inputShadow, position: 'relative' }}>
              <Stage
                width={804}
                height={623}
                key={stageKey}
                ref={stageRef}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
              >
                {/* 이미지 전용 레이어: 지우개 영향 받지 않도록 분리 */}
                <Layer listening={false}>
                  {imageUrl && (
                    <KonvaImage
                      image={konvaImage}
                      x={0}
                      y={0}
                      width={804}
                      height={623}
                    />
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

              {/* 가이드 메시지 */}
              {!imageUrl && lines.length === 0 && (
                <div style={{
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
                }}>
                  <img src="/draw.svg" alt="guide" width={120} height={90} style={{ marginBottom: 16 }} />
                  <div style={{ fontSize: 18, fontWeight: 500 }}>아이디어 작성하기</div>
                  <div style={{ fontSize: 14, color: theme.colors.gray[300] }}>
                    하단의 도구를 활용하여 아이디어를 그림이나 이미지로 표현해주세요!
                  </div>
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
        <BottomCon>
          {TOOLBAR_ICONS.map(({ type, key }) => (
            <ToolbarBtn
              key={key}
              $active={activeTool === type}
              onClick={() => handleToolbarClick(type)}
              aria-label={type}
            >
              <img
                src={ICON_SVGS[type]}
                alt={type}
                width={42}
                height={42}
                style={{ pointerEvents: 'none' }}
              />
            </ToolbarBtn>
          ))}
        </BottomCon>
      </Container>
    </OuterWrap>
  );
}

export default CanvasPage;
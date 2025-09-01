import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';

const TRACK_HEIGHT = 3;
const CONTROLLER_SIZE = 20;
const SLIDER_STEPS = ['small', 'medium', 'large'];

const getStepPosition = (step) => {
  // 0, 1, 2 => 0%, 50%, 100%
  return `${step * 50}%`;
};

const getActiveColor = (type) => {
  // brand color mapping, fallback to blue
  if (!type) return theme.colors.brand[1];
  if (type === 'creativity') return theme.colors.brand[3];
  if (type === 'aesthetics') return theme.colors.brand[1];
  if (type === 'usability') return theme.colors.brand[2];
  return theme.colors.brand[1];
};

const SliderWrap = styled.div`
  width: 100%;
  max-width: 194px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Track = styled.div`
  width: 100%;
  max-width: 204px;
  height: ${TRACK_HEIGHT}px;
  border-radius: 3px;
  background: ${({ $activeStep, $type }) => {
    const base = theme.colors.gray[200];
    const active = getActiveColor($type);
    if ($activeStep === 0) return base;
    // gradient for active part
    const percent = $activeStep * 50;
    return `linear-gradient(90deg, ${active} 0% ${percent}%, ${base} ${percent}%, ${base} 100%)`;
  }};
  position: relative;
  margin: 24px 0 0 0;
`;

const Controller = styled.div`
  position: absolute;
  top: 50%;
  left: ${({ $step }) => getStepPosition($step)};
  transform: translate(-50%, -50%);
  width: ${CONTROLLER_SIZE}px;
  height: ${CONTROLLER_SIZE}px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px 0px #00000025;
  cursor: pointer;
  transition: left 0.2s;
  z-index: 2;
`;

const StepArea = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

export default function Slider({ type = 'creativity', value = 0, onChange, onTouch }) {
  const [dragging, setDragging] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const trackRef = useRef(null);

  // update parent on drag end
  const commitValue = (val) => {
    setInternalValue(val);
    if (onChange) onChange(val);
    if (onTouch) onTouch(); // 슬라이더 터치 이벤트 발생
  };

  // Mouse/touch drag logic
  const handlePointerDown = (e) => {
    setDragging(true);
    e.preventDefault();
  };
  const handlePointerUp = () => {
    setDragging(false);
    if (onChange) onChange(internalValue);
    if (onTouch) onTouch(); // 드래그 종료 시에도 터치 이벤트 발생
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = trackRef.current.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    let step = 0;
    if (percent <= 0.33) step = 0;
    else if (percent <= 0.67) step = 1;
    else step = 2;
    setInternalValue(step);
  };

  // Click on track
  const handleTrackClick = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    let step = 0;
    if (percent <= 0.33) step = 0;
    else if (percent <= 0.67) step = 1;
    else step = 2;
    commitValue(step);
  };

  React.useEffect(() => {
    if (!dragging) setInternalValue(value);
  }, [value, dragging]);

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e) => handlePointerMove(e);
    const up = (e) => handlePointerUp(e);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging]);

  return (
    <SliderWrap>
      <Track
        ref={trackRef}
        $activeStep={internalValue}
        $type={type}
        onClick={handleTrackClick}
      >
        <Controller
          $step={internalValue}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        />
        <StepArea />
      </Track>
    </SliderWrap>
  );
}

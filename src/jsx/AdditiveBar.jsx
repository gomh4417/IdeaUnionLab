import styled from 'styled-components';
import { theme } from '../styles/theme';
import { useEffect } from 'react';

import AdditiveList from './AdditiveList';
import Slider from './Slider';

const BarContainer = styled.div`
  width: 236px;
  height: 498px;
  background: #fff;
  border-radius: ${theme.radius.large};
  box-shadow: ${theme.shadow};
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  margin-left: 612px;
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 600;
  line-height: 160%;
  color: ${theme.colors.gray[900]};
  margin-bottom: 12px;
`;

const ControlWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
  margin-bottom: 14px;
`;

const SubTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.gray[800]};
  line-height: 140%;
`;

const Guide = styled.div`
  font-size: 12px;
  letter-spacing: -0.02em;
  line-height: 16px;
  color: ${theme.colors.gray[600]};
`;

export default function AdditiveBar({ 
  selectedAdditive, 
  setSelectedAdditive, 
  sliderValue, 
  setSliderValue, 
  sliderTouched,
  setSliderTouched,
  referenceImage, 
  setReferenceImage 
}) {
  // 레퍼런스 이미지 상태 변화 감지 (중복 로그 방지)
  useEffect(() => {
    // 빈 값이나 null에서 실제 이미지로 변할 때만 로그 출력
    if (import.meta.env.DEV && referenceImage && referenceImage.startsWith('data:image')) {
      console.log('AdditiveBar - referenceImage 업로드됨');
    }
  }, [referenceImage]);

  return (
    <BarContainer>
      <Title>첨가제 선택</Title>
      <AdditiveList 
        selectedAdditive={selectedAdditive} 
        setSelectedAdditive={setSelectedAdditive}
        referenceImage={referenceImage}
        setReferenceImage={setReferenceImage}
      />
      <ControlWrap>
        <SubTitle>첨가제를 얼마나 넣을까요?</SubTitle>
        <Guide>아이디어의 변형 강도를 정할 수 있어요</Guide>
        <Slider 
          type={selectedAdditive || 'creativity'} 
          value={sliderValue} 
          onChange={setSliderValue}
          onTouch={() => setSliderTouched(true)}
        />
      </ControlWrap>
    </BarContainer>
  );
}

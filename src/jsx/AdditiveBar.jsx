import styled from 'styled-components';
import { theme } from '../styles/theme';

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

export default function AdditiveBar({ selectedAdditive, setSelectedAdditive, sliderValue, setSliderValue }) {
  return (
    <BarContainer>
      <Title>첨가제 선택</Title>
      <AdditiveList selectedAdditive={selectedAdditive} setSelectedAdditive={setSelectedAdditive} />
      <ControlWrap>
        <SubTitle>첨가제를 얼마나 넣을까요?</SubTitle>
        <Guide>아이디어의 변형 강도를 정할 수 있어요</Guide>
        <Slider type={selectedAdditive || 'creativity'} value={sliderValue} onChange={setSliderValue} />
      </ControlWrap>
    </BarContainer>
  );
}

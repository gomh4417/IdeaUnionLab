import styled from 'styled-components';
import { useRef, useState } from 'react';

const ReportWrap = styled.div`
  width: 528px;
  height: 100%;
  max-height: 834px;
  overflow-y: scroll;
  transform: translateY(-80px);
  padding-top: 92px;
  position: absolute;
  right: 40px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const LineWrap = styled.div`
  width: 20px;
  height: 100%;
  min-height: 2200px;
  transform: translateY(-92px);
  position: absolute;
`;

const Line = styled.div`
  width: 3px;
  left: 8px;
  position: absolute;
  height: 100%;
  background: #e0e0e0;
`;

const ScrollLine = styled.div`
  width: 3px;
  left: 0px;
  position: absolute;
  height: ${({ $height }) => $height}px;
  background: ${({ $brandcolor }) => $brandcolor || '#5755FE'};
  transition: height 0.2s, background 0.2s;
`;

const Circle = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ $active, $brandcolor }) => $active ? $brandcolor : '#A1A1A1'};
  position: relative;
  left: -48px;
  transition: background 0.2s;
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReportTextWrap = styled.div`
  margin-left: 48px;
  display: flex;
  flex-direction: column;
  gap: 72px;
  padding-bottom: 92px;
`;

const ChipWrap = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
`;

const Chip = styled.span`
  background: ${({ $active, $brandcolor }) => $active ? `${$brandcolor}1A` : '#f6f6fb'};
  padding: 4px 10px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  font-size: 12px;
  line-height: 160%;
  color: ${({ $active, $brandcolor }) => $active ? $brandcolor : '#a1a1a1'};
  transition: background 0.2s, color 0.2s;
  margin-left: -28px;
  letter-spacing: 2px;
`;

const ChipLabel = styled.h4`
  font-size: 16px;
  font-weight: 500;
  color: ${({ $active, $brandcolor }) => $active ? $brandcolor : '#a1a1a1'};
  line-height: 24px;
  transition: color 0.2s;
`;

const StepTextWrap = styled.div`
  display: flex;
  flex-direction: column;
  
  
`;

const StepTitle = styled.h5`
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  color: #333333;
    margin-bottom: 8px;
`;

const StepContent = styled.h5`
  font-size: 16px;
  font-weight: 300;
  line-height: 24px;
  letter-spacing: -2%;
  color: #555555;
  margin-bottom: 20px;
`;

export default function ResultReport({ brandColor, experimentResult, additiveType, additiveIntensity }) {
    const reportRef = useRef();
    const stepRefs = [useRef(), useRef(), useRef(), useRef()];
    const [scrollY, setScrollY] = useState(0);
    const [activeStepIndex, setActiveStepIndex] = useState(0);

    const CIRCLE_TRIGGER_OFFSET = 88 + 16; // 92은 패딩, 16은 Circle 마진 보정

    const handleScroll = () => {
        const scrollTop = reportRef.current.scrollTop;
        const stepPositions = stepRefs.map(ref => {
            const offsetTop = ref.current?.offsetTop || 0;
            return offsetTop - CIRCLE_TRIGGER_OFFSET;
        });
        const newActiveIndex = stepPositions.reduce((acc, curr, idx) => {
            return scrollTop >= curr ? idx : acc;
        }, 0);
        setScrollY(scrollTop);
        setActiveStepIndex(newActiveIndex);
    };

    const scrollLineHeight = 100 + scrollY;

    // 슬라이더 값에 따른 첨가제 강도 텍스트
    const getAdditiveIntensityText = (value) => {
        if (value === 0) return '적게';
        if (value === 1) return '적당히';
        if (value === 2) return '많이';
        return '적당히'; // 기본값
    };

    // 첨가제 타입을 한국어로 변환
    const getAdditiveTypeKorean = (type) => {
        const typeMap = {
            creativity: '창의성',
            aesthetics: '심미성',
            usability: '사용성'
        };
        return typeMap[type] || '창의성';
    };

    // GPT 응답 데이터가 있으면 사용
    const stepData = experimentResult?.steps ? [
        {
            title: experimentResult.steps[0]?.title || '원재료 아이디어 분석을 진행했습니다.',
            content: experimentResult.steps[0]?.description || '아이디어의 핵심 문제점과 개선 방향을 분석했습니다.',
            label: '원재료 아이디어 분석',
        },
        {
            title: `${getAdditiveTypeKorean(additiveType)} 첨가제를 '${getAdditiveIntensityText(additiveIntensity)}' 넣었어요!`,
            content: experimentResult.steps[1]?.description || `${getAdditiveTypeKorean(additiveType)} 첨가제를 ${additiveIntensity || 50}% 강도로 적용하여 아이디어를 개선했습니다.`,
            label: '첨가제 혼합',
        },
        {
            title: experimentResult.steps[2]?.title || '첨가제 혼합 과정',
            content: null, // Step 3의 description은 렌더링하지 않음
            label: '첨가제 혼합 과정',
            extra: experimentResult.steps[2]?.descriptions ? 
                experimentResult.steps[2].descriptions.map((desc, index) => ({
                    title: `${index + 1}단계`,
                    content: desc
                })) :
                experimentResult.steps[2]?.subSteps?.map(subStep => ({
                    title: subStep.title,
                    content: subStep.description
                })) || []
        },
        {
            title: experimentResult.steps[3]?.title || '최종 인사이트를 도출했어요!',
            content: experimentResult.steps[3]?.description || '창의적 솔루션을 완성했습니다.',
            label: '인사이트 도출',
        }
    ] : [];

    const color = brandColor || '#5755FE';

    return (
        <ReportWrap ref={reportRef} onScroll={handleScroll}>
            <LineWrap>
                <Line>
                    <ScrollLine $height={scrollLineHeight} $brandcolor={color} />
                </Line>
            </LineWrap>

            <ReportTextWrap>
                {stepData.length > 0 ? stepData.map((step, index) => {
                    const isActive = activeStepIndex >= index;
                    return (
                        <Step key={index} ref={stepRefs[index]}>
                            <ChipWrap>
                                <Circle $active={isActive} $brandcolor={color} />
                                <Chip $active={isActive} $brandcolor={color}>{index + 1}/4</Chip>
                                <ChipLabel $active={isActive} $brandcolor={color}>{step.label}</ChipLabel>
                            </ChipWrap>
                            {step.img && (
                                <img src={step.img} style={{
                                    width: '100%',
                                    height: 'auto',
                                    border: '1px solid #F1F1F1',
                                    borderRadius: '8px',
                                    marginBottom: '16px'
                                }} alt='' />
                            )}
                            <StepTextWrap>
                                {/* Step 3(첨가제 혼합 과정)의 title은 렌더링하지 않음 */}
                                {index !== 2 && <StepTitle>{step.title}</StepTitle>}
                                {step.content && <StepContent>{step.content}</StepContent>}
                                {step.extra?.map((e, i) => (
                                    <div key={i}>
                                        {additiveType === 'usability' ? (
                                            // 사용성 첨가제: descriptions만 표시 (title 없이)
                                            <StepContent>{e.content}</StepContent>
                                        ) : (
                                            // 창의성/심미성 첨가제: title과 description 모두 표시
                                            <>
                                                <StepTitle>{e.title}</StepTitle>
                                                <StepContent>{e.content}</StepContent>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </StepTextWrap>
                        </Step>
                    );
                }) : (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '400px',
                        color: '#999',
                        fontSize: '16px'
                    }}>
                        실험 결과 데이터가 없습니다.
                    </div>
                )}
            </ReportTextWrap>
        </ReportWrap>
    );
}

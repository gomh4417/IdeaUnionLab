import styled from 'styled-components';
import { useRef, useState } from 'react';

const ReportWrap = styled.div`
  width: 700px;
  height: 100%;
  max-height: 1080px;
  overflow-y: scroll;
  transform: translateY(-80px);
  padding-top: 108px;
  position: absolute;
  right: 52px;
  margin-top: -20px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const LineWrap = styled.div`
  width: 20px;
  height: 100%;
  min-height: 3300px;
  transform: translateY(-92px);
  position: absolute;
  margin-left: 6px;
  margin-top: -16px;
`;

const Line = styled.div`
  width: 4px;
  left: 8px;
  position: absolute;
  height: 100%;
  background: #e0e0e0;
`;

const ScrollLine = styled.div`
  width: 4px;
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
  left: -42px;
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
  padding: 4px 14px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
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

const OriginImgBox = styled.div`
  width: 650px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.medium};
  overflow: hidden;
    margin-bottom: 8px;
  
  img {
    width: 650px;
    
    object-fit: contain;
    display: block;
  }
`;

export default function ResultReport({ brandColor, experimentResult, additiveType, originalIdea, sourceImageUrl }) {
    const reportRef = useRef();
    const stepRefs = [useRef(), useRef(), useRef(), useRef()];
    const [scrollY, setScrollY] = useState(0);
    const [activeStepIndex, setActiveStepIndex] = useState(0);

    const CIRCLE_TRIGGER_OFFSET = 88 + 80; // 92은 패딩, 20은 Circle 마진 보정

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

    const scrollLineHeight = 160 + scrollY;

    // 슬라이더 값에 따른 첨가제 강도 텍스트 (현재 사용하지 않음)
    // const getAdditiveIntensityText = (value) => {
    //     if (value === 0) return '적게';
    //     if (value === 1) return '적당히';
    //     if (value === 2) return '많이';
    //     return '적당히'; // 기본값
    // };

    // 첨가제 타입을 한국어로 변환
    const getAdditiveTypeKorean = (type) => {
        const typeMap = {
            creativity: '창의성',
            aesthetics: '심미성',
            usability: '사용성'
        };
        return typeMap[type] || '창의성';
    };

    // 디버깅용 콘솔 로그
    console.log('🔍 ResultReport 디버깅:');
    console.log('- experimentResult 전체:', experimentResult);
    console.log('- experimentResult.steps:', experimentResult?.steps);
    console.log('- additiveType:', additiveType);
    
    if (experimentResult?.steps) {
        experimentResult.steps.forEach((step, index) => {
            console.log(`📋 Step ${index + 1}:`, step);
            if (step.stepNumber === 3) {
                console.log(`  - descriptions (사용성):`, step.descriptions);
                console.log(`  - subSteps (창의성/심미성):`, step.subSteps);
            }
        });
    }

    // script.js 구조로 변경된 Aiapi.js 응답 데이터 파싱
    const stepData = experimentResult?.steps ? experimentResult.steps.map((step, index) => {
        if (step.stepNumber === 3) {
            // Step 3: 첨가제 혼합 과정 (특별 처리)
            return {
                stepNumber: 3,
                title: step.title || '첨가제 혼합 과정',
                label: '첨가제 혼합 과정',
                // script.js 구조에 맞게 데이터 전달
                descriptions: step.descriptions, // 사용성용
                subSteps: step.subSteps // 창의성/심미성용
            };
        } else {
            // Step 1, 2, 4: 일반적인 title + description 구조
            return {
                stepNumber: step.stepNumber,
                title: step.title || `Step ${step.stepNumber}`,
                description: step.description || '설명이 없습니다.',
                label: index === 0 ? '원재료 아이디어 분석' : 
                       index === 1 ? '첨가제 혼합' :
                       index === 3 ? '인사이트 도출' : `Step ${index + 1}`
            };
        }
    }) : [];

    console.log('✅ 파싱된 stepData:', stepData);

    const color = brandColor || '#5755FE';

    return (
        <ReportWrap ref={reportRef} onScroll={handleScroll}>
            <LineWrap>
                <Line>
                    <ScrollLine $height={scrollLineHeight} $brandcolor={color} />
                </Line>
            </LineWrap>

            <ReportTextWrap>
                {experimentResult?.steps && experimentResult.steps.length > 0 ? (
                    // 하드코딩 방식: 각 Step을 직접 정의
                    <>
                        {/* Step 1: 원재료 아이디어 분석 */}
                        <Step ref={stepRefs[0]}>
                            <ChipWrap>
                                <Circle $active={activeStepIndex >= 0} $brandcolor={color} />
                                <Chip $active={activeStepIndex >= 0} $brandcolor={color}>1/4</Chip>
                                <ChipLabel $active={activeStepIndex >= 0} $brandcolor={color}>원재료 아이디어 분석</ChipLabel>
                            </ChipWrap>
                            {/* 🔥 sourceImageUrl이 있으면 우선 사용 (과거 기록 보기 모드), 없으면 originalIdea.imageUrl 사용 */}
                            {(sourceImageUrl || originalIdea?.imageUrl) && (
                                <OriginImgBox>
                                    <img src={sourceImageUrl || originalIdea.imageUrl} alt="원재료 아이디어 이미지" />
                                </OriginImgBox>
                            )}
                            <StepTextWrap>
                                <StepTitle>
                                    {experimentResult.steps[0]?.title || '원재료 아이디어 분석을 진행했습니다.'}
                                </StepTitle>
                                <StepContent>
                                    {experimentResult.steps[0]?.description || '아이디어의 핵심 문제점과 개선 방향을 분석했습니다.'}
                                </StepContent>
                            </StepTextWrap>
                        </Step>

                        {/* Step 2: 첨가제 혼합 */}
                        <Step ref={stepRefs[1]}>
                            <ChipWrap>
                                <Circle $active={activeStepIndex >= 1} $brandcolor={color} />
                                <Chip $active={activeStepIndex >= 1} $brandcolor={color}>2/4</Chip>
                                <ChipLabel $active={activeStepIndex >= 1} $brandcolor={color}>첨가제 혼합</ChipLabel>
                            </ChipWrap>
                            <StepTextWrap>
                                <StepTitle>
                                    {experimentResult.steps[1]?.title || `${getAdditiveTypeKorean(additiveType)} 첨가제를 넣었어요!`}
                                </StepTitle>
                                <StepContent>
                                    {experimentResult.steps[1]?.description || `${getAdditiveTypeKorean(additiveType)} 첨가제를 적용하여 아이디어를 개선하는 과정을 설명합니다.`}
                                </StepContent>
                            </StepTextWrap>
                        </Step>

                        {/* Step 3: 첨가제 혼합 과정 (특별 처리) */}
                        <Step ref={stepRefs[2]}>
                            <ChipWrap>
                                <Circle $active={activeStepIndex >= 2} $brandcolor={color} />
                                <Chip $active={activeStepIndex >= 2} $brandcolor={color}>3/4</Chip>
                                <ChipLabel $active={activeStepIndex >= 2} $brandcolor={color}>첨가제 혼합 과정</ChipLabel>
                            </ChipWrap>
                            <StepTextWrap>
                                {additiveType === 'usability' && (
                                    <StepTitle>
                                        {experimentResult.steps[2]?.title || '첨가제 혼합 과정'}
                                    </StepTitle>
                                )}
                               
                                
                                {additiveType === 'usability' ? (
                                    // 사용성: descriptions 배열 하드코딩
                                    
                                    experimentResult.steps[2]?.descriptions?.length > 0 ? (
                                        experimentResult.steps[2].descriptions.map((desc, i) => (
                                            <StepContent key={i}>
                                                <strong>{i + 1}단계:</strong> {desc}
                                            </StepContent>
                                        ))
                                    ) : (
                                        <>
                                            <StepContent>1단계: 사용성 분석 단계가 진행되었습니다.</StepContent>
                                            <StepContent>2단계: 개선 방향이 도출되었습니다.</StepContent>
                                            <StepContent>3단계: 사용자 경험이 최적화되었습니다.</StepContent>
                                        </>
                                    )
                                ) : (
                                    // 창의성/심미성: subSteps 배열 하드코딩
                                    experimentResult.steps[2]?.subSteps?.length > 0 ? (
                                        experimentResult.steps[2].subSteps.map((sub, i) => (
                                            <div key={i} style={{ marginBottom: '16px' }}>
                                                <StepTitle style={{ fontSize: '18px', marginBottom: '4px' }}>
                                                    {sub.title}
                                                </StepTitle>
                                                <StepContent>{sub.description}</StepContent>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: '16px' }}>
                                                <StepTitle style={{ fontSize: '18px', marginBottom: '4px' }}>
                                                    {additiveType === 'creativity' ? 'TRIZ 원리 적용' : '심미적 스키마 적용'}
                                                </StepTitle>
                                                <StepContent>
                                                    {additiveType === 'creativity' ? 
                                                        '창의적 문제 해결 원리가 적용되었습니다.' : 
                                                        '심미적 개선 방향이 도출되었습니다.'}
                                                </StepContent>
                                            </div>
                                            <div style={{ marginBottom: '16px' }}>
                                                <StepTitle style={{ fontSize: '18px', marginBottom: '4px' }}>
                                                    구체적 개선 방안
                                                </StepTitle>
                                                <StepContent>실용적인 개선안이 제시되었습니다.</StepContent>
                                            </div>
                                            <div style={{ marginBottom: '16px' }}>
                                                <StepTitle style={{ fontSize: '18px', marginBottom: '4px' }}>
                                                    최종 구현 전략
                                                </StepTitle>
                                                <StepContent>효과적인 구현 방법이 도출되었습니다.</StepContent>
                                            </div>
                                        </>
                                    )
                                )}
                            </StepTextWrap>
                        </Step>

                        {/* Step 4: 인사이트 도출 */}
                        <Step ref={stepRefs[3]}>
                            <ChipWrap>
                                <Circle $active={activeStepIndex >= 3} $brandcolor={color} />
                                <Chip $active={activeStepIndex >= 3} $brandcolor={color}>4/4</Chip>
                                <ChipLabel $active={activeStepIndex >= 3} $brandcolor={color}>인사이트 도출</ChipLabel>
                            </ChipWrap>
                            <StepTextWrap>
                                <StepTitle>
                                    {experimentResult.steps[3]?.title || '최종 인사이트를 도출했어요!'}
                                </StepTitle>
                                <StepContent>
                                    {experimentResult.steps[3]?.description || '창의적 솔루션을 완성했습니다.'}
                                </StepContent>
                            </StepTextWrap>
                        </Step>
                    </>
                ) : (
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

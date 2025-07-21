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
  min-height: 2000px;
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
  margin-bottom: 16px;
  gap: 8px;
`;

const Chip = styled.span`
  background: ${({ $active, $brandcolor }) => $active ? `${$brandcolor}1A` : '#f6f6fb'};
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 160%;
  color: ${({ $active, $brandcolor }) => $active ? $brandcolor : '#a1a1a1'};
  transition: background 0.2s, color 0.2s;
  margin-left: -28px;
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
  gap: 8px;
`;

const StepTitle = styled.h5`
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  color: #333333;
`;

const StepContent = styled.h5`
  font-size: 16px;
  font-weight: 300;
  line-height: 24px;
  letter-spacing: -2%;
  color: #555555;
  margin-bottom: 8px;
`;

export default function ResultReport({ brandColor }) {
    const reportRef = useRef();
    const stepRefs = [useRef(), useRef(), useRef(), useRef()];
    const [scrollY, setScrollY] = useState(0);
    const [activeStepIndex, setActiveStepIndex] = useState(0);

    const CIRCLE_TRIGGER_OFFSET = 92 + 16; // 92은 패딩, 16은 Circle 마진 보정

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

    const stepData = [
        {
            title: '짧은 시간 동안 가볍게 읽기 위한 제품이에요!',
            content: `BookTH는 전체적으로 컴팩트하고 심플한 디자인이지만, 책을 찾는 데 도움을 주는 정보 탐색 기능이 부족하고, 앉아서 쉴 수 있는 공간도 없어 독서에 오래 머무르긴 어려웠어요. 또 책장이 단조롭게 수동으로만 확장돼서, 조금은 지루하게 느껴질 수 있었어요.`,
            label: '원재료 아이디어분석',
            img: 'CreativityImg.png',
        },
        {
            title: '창의성 첨가제를 ‘적당히’ 넣었어요!',
            content: `창의성 첨가제는 TRIZ라는 문제를 새로운 방식으로 해결할 수 있도록 돕는 창의적 사고 도구를 활용해요. BookTH에 TRIZ를 적용하면, 순차적으로 문제를 분석하고 창의적으로 재구성하게 돼요.`,
            label: '첨가제 혼합',
        },
        {
            title: '책을 찾기 어려웠어요',
            content: `BookTH는 책장이 확장되긴 하지만, 원하는 책을 빠르게 찾기 어렵고 정보 탐색이 불편했어요. 어떤 책이 있는지 미리 알 수 없고, 주제별로 정리되어 있지도 않았어요.`,
            label: '첨가제 혼합 과정',
            extra: [
                { title: '앉을 곳이 없었어요', content: '책을 꺼내 읽으려고 해도 주변에 앉을 자리가 없어 오래 머물기 어려웠어요. 공원에서 책을 읽는다는 목적에 비해 쉼 공간이 부족했어요.' },
                { title: '구조가 단조로웠어요', content: '책장이 위로만 확장돼서, 반복해서 사용할수록 지루하게 느껴질 수 있었어요. 조작 방식도 단순해 흥미를 유발하기 어려웠죠.' },
            ]
        },
        {
            title: 'TRIZ 원리로 인사이트를 찾았어요!',
            content: `앞선 문제점을 바탕으로 TRIZ의 ‘통합’, ‘다용도성’, ‘다기능성’, ‘자기 서비스’, ‘차원 변화’, ‘역동성’ 원리를 적용하여 정보 탐색을 위한 디스플레이와 검색 기능을 책장 구조에 통합하고, 자동 접이식 의자와 캐노피를 결합해 사용자가 머무를 수 있는 쉼 공간을 확보했으며, 회전하거나 슬라이딩되는 구조로 만들었어요.`,
            label: '인사이트 도출',
        }
    ];

    const color = brandColor || '#5755FE';

    return (
        <ReportWrap ref={reportRef} onScroll={handleScroll}>
            <LineWrap>
                <Line>
                    <ScrollLine $height={scrollLineHeight} $brandcolor={color} />
                </Line>
            </LineWrap>

            <ReportTextWrap>
                {stepData.map((step, index) => {
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
                                <StepTitle>{step.title}</StepTitle>
                                <StepContent>{step.content}</StepContent>
                                {step.extra?.map((e, i) => (
                                    <div key={i}>
                                        <StepTitle>{e.title}</StepTitle>
                                        <StepContent>{e.content}</StepContent>
                                    </div>
                                ))}
                            </StepTextWrap>
                        </Step>
                    );
                })}
            </ReportTextWrap>
        </ReportWrap>
    );
}

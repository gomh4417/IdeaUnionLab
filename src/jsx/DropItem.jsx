import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const ICONS = {
  creativity: '/creativity.svg',
  aesthetics: '/aesthetics.svg',
  usability: '/usability.svg',
};

const BRAND_COLORS = {
  creativity: (theme) => theme.colors.brand[3],
  aesthetics: (theme) => theme.colors.brand[1],
  usability: (theme) => theme.colors.brand[2],
};

const Container = styled.div`
  width: 563px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: ${({ $isresult }) => $isresult ? '0' : '24px'};
  padding-left: ${({ $isresult }) => $isresult ? '-12px' : '0'};
`;

const ChipRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  margin-top: 8px;
`;

const Chip = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  background: ${({ $brandcolor }) => $brandcolor ? `${$brandcolor}1A` : '#F6F6FB'};
  border-radius: ${({ theme }) => theme.radius.medium};
  padding: 4px 10px 4px 6px;
  height: 32px;
  margin-bottom: 8px;
`;

const ChipIcon = styled.img`
  width: 24px;
  height: 24px;
`;

const ChipText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ $brandcolor, theme }) => $brandcolor || theme.colors.gray[900]};
  line-height: 160%;
`;

const ChipLabel = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ $brandcolor }) => $brandcolor || '#cccccc'};
  line-height: 32px;
  margin-bottom: 8px;
`;

const ImgContainer = styled.div`
  width: 563px;
  height: 443px;
  border-radius: ${({ theme }) => theme.radius.small};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  overflow: hidden;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: #fff;
  text-align: center;
  
  .main-text {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  
  .sub-text-container {
    position: relative;
    height: 24px;
    width: 400px;
    overflow: hidden;
  }
  
  .sub-text {
    font-size: 16px;
    font-weight: 300;
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    white-space: nowrap;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 6px;
  align-self: flex-start;
  filter: ${({ $loading, $pageType, $blurIntensity }) => 
    $loading && $pageType === 'result' ? `blur(${$blurIntensity}px)` : 'none'
  };
  transition: filter 0.3s ease-in-out;
`;

const Content = styled.div`
  font-size: 16px;
  font-weight: 300;
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 24px;
  text-align: justify;
  width: 100%;
  max-height: 172px;
  overflow-y: scroll;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
  filter: ${({ $loading, $pageType, $blurIntensity }) => 
    $loading && $pageType === 'result' ? `blur(${$blurIntensity}px)` : 'none'
  };
  transition: filter 0.3s ease-in-out;
`;

export default function DropItem({ 
  title, 
  imageUrl, 
  content, 
  type, 
  additiveType, 
  generation = 1, 
  pageType = 'lab',
  loading = false,
  loadingColor = null,
  loadingExit = false
}) {
  const theme = useTheme();
  

  const labTexts = [
    "사용자의 원재료를 분석하고 있어요",
    "원재료에 첨가제를 추가하고 있어요", 
    "실험 결과 리포트를 작성하고 있어요"
  ];
  
  const resultTexts = [
    "결과물을 시각화하고 있어요",
    "이미지 안정화 작업 중이에요",
    "실험실을 정리하고 있어요"
  ];
  
  const subTexts = pageType === 'result' ? resultTexts : labTexts;
  const mainText = pageType === 'result' ? "최종 완성된 이미지를 생성하고 있어요!" : "디자인 실험을 시작했어요!";
  
  // 6.5초마다 blur 강도 변화
  const [blurIntensity, setBlurIntensity] = useState(8); // 기본 blur 강도
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  useEffect(() => {
    if (!loading || pageType !== 'result') return;
    
    const blurInterval = setInterval(() => {
      setBlurIntensity(7.6);

      setTimeout(() => {
        setBlurIntensity(8);
      }, 500);
    }, 6500);
    
    return () => clearInterval(blurInterval);
  }, [loading, pageType]);
  
  
  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % subTexts.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [loading, subTexts.length]);
  
  let brandColor = theme.colors.brand[1];
  if (additiveType) {
    const fn = BRAND_COLORS[additiveType];
    brandColor = fn ? fn(theme) : theme.colors.brand[1];
  }

  if (imageUrl) {
    console.log(' DropItem imageUrl 확인:');
    console.log('  - Title:', title);
    console.log('  - Type:', type);
    console.log('  - ImageURL:', imageUrl);
    console.log('  - URL Type:', imageUrl.includes('.firebasestorage.app') ? 'firebasestorage.app' : 
                                  imageUrl.includes('firebasestorage.googleapis.com') ? 'googleapis.com' : 'other');
  }

  const isResult = type === 'result';
  const isLabPage = pageType === 'lab';
  const isResultPage = pageType === 'result';
  
  return (
    <Container $isresult={isResult}>
      {/* ResultPage: 생성물이고 additiveType이 있고 generation이 1 이상인 경우 Image 위에 chip 표시 */}
      {isResultPage && isResult && additiveType && generation >= 1 && (
        <ChipRow>
          <Chip $brandcolor={brandColor}>
            <ChipIcon src={ICONS[additiveType] || ICONS['creativity']} alt="icon" />
            <ChipText $brandcolor={brandColor}>{generation}차 생성물</ChipText>
          </Chip>
          <ChipLabel $brandcolor={brandColor}>
            생성된 아이디어
          </ChipLabel>
        </ChipRow>
      )}
      
      {imageUrl && (
        <ImgContainer>
          <Image src={imageUrl} alt={title} />
          
          {/* 로딩 오버레이 */}
          {loading && (
            <LoadingOverlay
              initial={
                pageType === 'result' 
                  ? { scale: 1, opacity: 1 }  // ResultPage: 즉시 나타남
                  : { scale: 0 }              // LabPage: spring 효과
              }
              animate={
                loadingExit 
                  ? { scale: 0, opacity: 0 }  // Exit 애니메이션
                  : { scale: 1, opacity: 1 }  
              }
              exit={{ scale: 0, opacity: 0 }}
              transition={
                loadingExit 
                  ? { duration: 0.6, ease: "easeInOut" }  // Exit 애니메이션
                  : pageType === 'result'
                    ? { duration: 0 }                     // ResultPage: 즉시
                    : {                                   // LabPage: spring
                        type: 'spring', 
                        stiffness: 50,
                        damping: 5,
                        mass: 0.5
                      }
              }
              style={{ 
                backgroundColor: loadingColor || '#5755FE'
              }}
            >
              <LoadingSpinner />
              <LoadingText>
                <div className="main-text">{mainText}</div>
                <div className="sub-text-container">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTextIndex}
                      className="sub-text"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        duration: 0.5,
                        ease: "easeInOut"
                      }}
                    >
                      {subTexts[currentTextIndex]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </LoadingText>
            </LoadingOverlay>
          )}
        </ImgContainer>
      )}

      {/* LabPage: 생성물이고 additiveType이 있고 generation이 1 이상인 경우 Title 위에 chip 표시 */}
      {isLabPage && isResult && additiveType && generation >= 1 && (
        <ChipRow>
          <Chip $brandcolor={brandColor}>
            <ChipIcon src={ICONS[additiveType] || ICONS['creativity']} alt="icon" />
            <ChipText $brandcolor={brandColor}>{generation}차 생성물</ChipText>
          </Chip>
        </ChipRow>
      )}
      
      <Title $loading={loading} $pageType={pageType} $blurIntensity={blurIntensity}>{title}</Title>
      <Content $loading={loading} $pageType={pageType} $blurIntensity={blurIntensity}>{content}</Content>
    </Container>
  );
}

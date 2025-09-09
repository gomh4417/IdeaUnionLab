import React from 'react';
import { useTheme } from 'styled-components';
import styled from 'styled-components';

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
`;



// DropItem: { title, imageUrl, content, type, additiveType, pageType } props로 받음
// type: 'original' (원재료) | 'result' (생성물)
// pageType: 'lab' | 'result' - 페이지에 따른 레이아웃 변경
// generation: 1, 2, 3, ... (default 1)
export default function DropItem({ title, imageUrl, content, type, additiveType, generation = 1, pageType = 'lab' }) {
  const theme = useTheme();
  let brandColor = theme.colors.brand[1];
  if (additiveType) {
    const fn = BRAND_COLORS[additiveType];
    brandColor = fn ? fn(theme) : theme.colors.brand[1];
  }

  const isResult = type === 'result';
  const isOriginal = type === 'original';
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
      
      <Title>{title}</Title>
      <Content>{content}</Content>
    </Container>
  );
}

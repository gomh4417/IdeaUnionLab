import styled from 'styled-components';
import { theme } from '../styles/theme';
import { useEffect, useState } from 'react';
import { getRecentUploadedImages } from '../utils/firebaseUpload';

import AdditiveList from './AdditiveList';
import Slider from './Slider';

const BarContainer = styled.div`
  width: 320px;
  height: 584px;
  background: #fff;
  border-radius: ${theme.radius.large};
  box-shadow: ${theme.shadow};
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  margin-left: 1172px;
  
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  line-height: 160%;
  color: ${theme.colors.gray[900]};
  margin-bottom: 12px;
  margin-left: 8px;
`;

const ControlWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 8px;
  margin-bottom: 16px;
  margin-top: 28px;
`;

const SubTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${theme.colors.gray[800]};
  line-height: 140%;
`;

const Guide = styled.div`
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 16px;
  color: ${theme.colors.gray[600]};
`;

// 이미지 선택 모달 (CanvasPage와 동일한 스타일)
const ImageSelectOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #00000040;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ImageSelectModal = styled.div`
  background: #ffffff;
  backdrop-filter: blur(10px);
  border-radius: ${theme.radius.large};
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 800px;
  min-height: 400px;
  width: 100%;
`;

const ModalTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${theme.colors.gray[900]};
  font-family: 'Pretendard', sans-serif;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 140px);
  gap: 12px;
  width: 100%;
  justify-content: center;
`;

const ImageItem = styled.div`
  width: 140px;
  height: 140px;
  border-radius: ${theme.radius.small};
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #eee;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${theme.colors.primary};
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CloseButton = styled.button`
  background: ${theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${theme.radius.max};
  padding: 10px 24px;
  font-size: 18px;
  font-weight: 600;
  font-family: 'Pretendard', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  position: absolute;
  bottom: 24px;
  
  &:hover {
    background: ${theme.colors.gray[300]};
  }
`;

const EmptyMessage = styled.div`
  font-size: 16px;
  color: ${theme.colors.gray[500]};
  font-family: 'Pretendard', sans-serif;
  text-align: center;
  padding: 40px 20px;
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
  // 이미지 선택 모달 상태
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  // 레퍼런스 이미지 상태 변화 감지 (중복 로그 방지)
  useEffect(() => {
    // 빈 값이나 null에서 실제 이미지로 변할 때만 로그 출력
    if (import.meta.env.DEV && referenceImage && referenceImage.startsWith('data:image')) {
      console.log('AdditiveBar - referenceImage 업로드됨');
    }
  }, [referenceImage]);

  // 이미지 모달 열기
  const handleOpenImageModal = async () => {
    setShowImageModal(true);
    const images = await getRecentUploadedImages();
    setUploadedImages(images);
  };

  // 이미지 선택 처리
  const handleImageSelect = async (imageUrl) => {
    try {
      console.log('🖼️ 레퍼런스 이미지 선택:', imageUrl);
      setReferenceImage(imageUrl);
      setShowImageModal(false);
    } catch (error) {
      console.error('❌ 이미지 로드 실패:', error);
      alert('이미지를 불러오는데 실패했습니다.');
    }
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setUploadedImages([]);
  };

  return (
    <>
      <BarContainer>
        <Title>첨가제 선택</Title>
        <AdditiveList 
          selectedAdditive={selectedAdditive} 
          setSelectedAdditive={setSelectedAdditive}
          referenceImage={referenceImage}
          setReferenceImage={setReferenceImage}
          onOpenImageModal={handleOpenImageModal}
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

      {/* 이미지 선택 모달 */}
      {showImageModal && (
        <ImageSelectOverlay onClick={handleCloseImageModal}>
          <ImageSelectModal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>레퍼런스 이미지 선택</ModalTitle>
            
            {uploadedImages.length > 0 ? (
              <ImageGrid>
                {uploadedImages.map((img, index) => (
                  <ImageItem
                    key={index}
                    onClick={() => handleImageSelect(img.url)}
                    title={img.name}
                  >
                    <img src={img.url} alt={`업로드 이미지 ${index + 1}`} />
                  </ImageItem>
                ))}
              </ImageGrid>
            ) : (
              <EmptyMessage>
                아직 업로드된 이미지가 없습니다.<br />
                upload.html 페이지에서 이미지를 업로드해주세요.
              </EmptyMessage>
            )}
            
            <CloseButton onClick={handleCloseImageModal}>닫기</CloseButton>
          </ImageSelectModal>
        </ImageSelectOverlay>
      )}
    </>
  );
}

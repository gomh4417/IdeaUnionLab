import styled from 'styled-components';
import { theme } from '../styles/theme';

const ItemWrap = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 236px;
  transform: translateX(-14px);
  height: 64px;
  padding: 8px 0px 8px 10px;
  cursor: pointer;
  background: ${({ $type }) => $type === 'activated' ? theme.colors.secondary : '#fff'};
  border-left: 4px solid ${({ $type }) => $type === 'activated' ? theme.colors.primary : 'transparent'};
  transition: background 0.2s, border-color 0.2s;
  box-sizing: border-box;
  
`;

const ImgBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${theme.radius.medium};
  background: #eee;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0;
  margin-right: 14px;
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: ${theme.colors.gray[900]};
  margin-bottom: 2px;
  line-height: 140%;
  letter-spacing: -0.02em;
`;

const Tag = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: ${theme.colors.gray[500]};
  line-height: 140%;
  letter-spacing: -0.02em;
`;

export default function Item({ imageUrl, title, type = 'default', onClick }) {
  return (
    <ItemWrap $type={type} onClick={onClick}>
      <ImgBox>
        {imageUrl && <Img src={imageUrl} alt="item" />}
      </ImgBox>
      <InfoWrap>
        <Title>{title}</Title>
        <Tag>#테스트</Tag>
      </InfoWrap>
    </ItemWrap>
  );
}

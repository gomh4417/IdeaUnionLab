import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../jsx/Header';
import styled from 'styled-components';
import ResultReport from '../jsx/ResultReport';


import DropItem from '../jsx/DropItem';

const LayoutWrap = styled.div`
  display: flex;
  flex-direction: column;
  padding: 25px 32px 32px 32px;
`;

const ContentWrap = styled.div`
  display: flex;
  gap: 40px;
`;




function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // LabPage에서 넘겨준 item, additiveType, brandColor
  const item = location.state?.item;
  const additiveType = location.state?.additiveType;
  const brandColor = location.state?.brandColor;

  return (
    <LayoutWrap>
      <Header type="back" onClick={() => navigate('/lab')}>Project Name</Header>
      <ContentWrap>
        {item && (
          <DropItem
            {...item}
            type="result"
            additiveType={additiveType}
          />
        )}
        <ResultReport brandColor={brandColor} />
      </ContentWrap>
    </LayoutWrap>
  );
}

export default ResultPage;

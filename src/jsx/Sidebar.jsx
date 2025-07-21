
import { useState } from 'react';
import ItemList from './ItemList';
import { useNavigate } from 'react-router-dom';
import Icons from '../assets/Icons';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';


// Styled Sidebar Container
// AddItem styles
const AddItemWrap = styled.div`
  display: flex;
  align-items: center;
  width: 235px;
  height: 64px;
  padding: 8px 0px;
  cursor: pointer;
`;

const AddBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.medium};
  border: 1px dashed ${({ theme }) => theme.colors.gray[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
`;

const AddText = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.gray[600]};
  
`;
const SidebarContainer = styled.div`
  width: 236px;
  height: 720px;
  border-radius: ${props => props.theme.radius.large};
  overflow: hidden;
  padding: 10px 14px;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.theme.shadow};
  
`;

// BtnWrap styled-component
const BtnWrap = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const Btn = styled.button`
  width: 104px;
  height: 42px;
  border-radius: ${props => props.theme.radius.medium};
  background: ${({ $type, theme }) => $type === 'active' ? theme.colors.secondary : 'transparent'};
  color: ${({ $type, theme }) => $type === 'active' ? '#222' : theme.colors.gray[400]};
  font-size: 14px;
  font-weight: ${({ $type }) => $type === 'active' ? 600 : 500};
  border: none;
  outline: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
`;

const Divider = styled.div`
  width: 100%;
  height: 0.5px;
  background: ${props => props.theme.colors.gray[300]};
  margin-bottom: 6px;
  margin-top: 8px;
`;

function BtnToggle({ active, onChange }) {
  return (
    <BtnWrap>
      <Btn $type={active === 'raw' ? 'active' : 'default'} onClick={() => onChange('raw')}>
        원재료
      </Btn>
      <Btn $type={active === 'result' ? 'active' : 'default'} onClick={() => onChange('result')}>
        생성물
      </Btn>
    </BtnWrap>
  );
}

export default function Sidebar({ projects = [], activatedIdx, setActivatedIdx, onDeleteItem }) {
  const [active, setActive] = useState('raw');
  const navigate = useNavigate();
  return (
    <ThemeProvider theme={theme}>
      <SidebarContainer>
        <BtnToggle active={active} onChange={setActive} />
        <Divider />
        {active === 'raw' && (
          <AddItemWrap onClick={() => navigate('/write')}>
            <AddBox>
              <Icons type="add" size={12} color={theme.colors.gray[500]} />
            </AddBox>
            <AddText>원재료 추가하기</AddText>
          </AddItemWrap>
        )}
        {/* ItemList로 프로젝트 리스트 렌더링 */}
        <ItemList items={projects} activatedIdx={activatedIdx} onDeleteItem={onDeleteItem} />
      </SidebarContainer>
    </ThemeProvider>
  );
}

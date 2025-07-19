
import { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';


// Styled Sidebar Container
const SidebarContainer = styled.div`
  width: 236px;
  height: 725px;
  border-radius: ${props => props.theme.radius.large};
  overflow: hidden;
  padding: 8px;
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
  gap: 0px;
`;

const Btn = styled.button`
  width: 100px;
  height: 45px;
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
  margin-bottom: 12px;
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

export default function Sidebar() {
  const [active, setActive] = useState('raw');
  return (
    <ThemeProvider theme={theme}>
      <SidebarContainer>
        <BtnToggle active={active} onChange={setActive} />
        <Divider />
        {/* 여기에 컨텐츠 추가 */}
      </SidebarContainer>
    </ThemeProvider>
  );
}

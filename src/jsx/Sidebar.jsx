
import { useState } from 'react';
import ItemList from './ItemList';
import { useNavigate } from 'react-router-dom';
import Icons from '../assets/Icons';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';


const AddItemWrap = styled.div`
  display: flex;
  align-items: center;
  width: 260px;
  height: 72px;
  padding: 8px 0px;
  cursor: pointer;
  margin: 0px 14px;
`;

const AddBox = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.radius.medium};
  border: 1px dashed ${({ theme }) => theme.colors.gray[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`;

const AddText = styled.span`
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.gray[600]};
  
`;
const SidebarContainer = styled.div`
  width: 260px;
  height: 940px;
  border-radius: ${props => props.theme.radius.large};
  overflow: hidden;
  padding: 10px 0px;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.theme.shadow};
`;


const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* webkit 스크롤바 숨기기 */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Firefox 스크롤바 숨기기 */
  scrollbar-width: none;
  
  /* IE/Edge 스크롤바 숨기기 */
  -ms-overflow-style: none;
`;


const BtnWrap = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 0px 14px;
`;

const Btn = styled.button`
  width: 120px;
  height: 42px;
  border-radius: ${props => props.theme.radius.medium};
  background: ${({ $type, theme }) => $type === 'active' ? theme.colors.secondary : 'transparent'};
  color: ${({ $type, theme }) => $type === 'active' ? '#222' : theme.colors.gray[400]};
  font-size: 16px;
  font-weight: ${({ $type }) => $type === 'active' ? 600 : 400};
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

export default function Sidebar({ projects, activatedId, onDeleteItem, projectId, onDragStateChange, onItemSelect }) {
  const [active, setActive] = useState('raw');
  const navigate = useNavigate();
  
  
  const filteredProjects = projects.filter(project => {
    if (active === 'raw') {
      // 원재료: ID가 "idea_"로 시작하는 것들 (result_idea_ 제외)
      return project.id?.startsWith('idea_') && !project.id?.startsWith('result_idea_');
    } else {
      // 생성물: ID가 "result_idea_"로 시작하는 것들
      return project.id?.startsWith('result_idea_');
    }
  });
  
  // 개발 환경에서 필터링된 결과 로깅
  if (import.meta.env.DEV) {
    console.log(`🔍 Sidebar 필터링 결과 (${active}):`, filteredProjects.map(p => ({ 
      id: p.id, 
      title: p.title?.substring(0, 20) + '...' 
    })));
  }
  
  // 현재 활성화된 아이템이 현재 탭에 있는지 확인
  const activeItemInCurrentTab = activatedId ? 
    filteredProjects.some(item => item.id === activatedId) : false;
  
  // 필터링된 배열에서 활성화된 아이템의 인덱스 찾기
  const getFilteredActiveIndex = () => {
    if (!activeItemInCurrentTab || !activatedId) return null;
    return filteredProjects.findIndex(item => item.id === activatedId);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <SidebarContainer>
        <BtnToggle active={active} onChange={setActive} />
        <Divider />
        <ScrollableContent>
          {active === 'raw' && (
            <AddItemWrap onClick={() => navigate('/write', { state: { projectId } })}>
              <AddBox>
                <Icons type="add" size={12} color={theme.colors.gray[500]} />
              </AddBox>
              <AddText>원재료 추가하기</AddText>
            </AddItemWrap>
          )}
          {/* 필터링된 아이디어 리스트 렌더링 */}
          <ItemList
            items={filteredProjects}
            originalItems={projects}
            activatedIdx={getFilteredActiveIndex()}
            onDeleteItem={onDeleteItem}
            onDragStateChange={onDragStateChange}
            onItemSelect={onItemSelect}
          />
        </ScrollableContent>
      </SidebarContainer>
    </ThemeProvider>
  );
}

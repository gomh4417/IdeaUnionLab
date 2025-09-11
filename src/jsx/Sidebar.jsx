
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
  margin: 0px 14px;
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
  padding: 10px 0px;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.theme.shadow};
`;

// 스크롤 가능한 콘텐츠 영역
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

// BtnWrap styled-component
const BtnWrap = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 0px 14px;
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

export default function Sidebar({ projects, activatedIdx, setActivatedIdx, onDeleteItem, projectId, onDragStateChange }) {
  const [active, setActive] = useState('raw');
  const navigate = useNavigate();
  
  // 활성 탭에 따라 아이디어 필터링
  const filteredProjects = projects.filter(project => {
    if (active === 'raw') {
      // 원재료: ID가 "idea_"로 시작하는 것들 (result_idea_ 제외)
      return project.id?.startsWith('idea_') && !project.id?.startsWith('result_idea_');
    } else {
      // 생성물: ID가 "result_idea_"로 시작하는 것들
      return project.id?.startsWith('result_idea_');
    }
  });
  
  // 현재 활성화된 아이템이 현재 탭에 있는지 확인
  const activeItemInCurrentTab = activatedIdx !== null && activatedIdx < projects.length ? 
    filteredProjects.some(item => item.id === projects[activatedIdx]?.id) : false;
  
  // 필터링된 배열에서 활성화된 아이템의 인덱스 찾기
  const getFilteredActiveIndex = () => {
    if (!activeItemInCurrentTab || activatedIdx === null) return null;
    const activeItem = projects[activatedIdx];
    return filteredProjects.findIndex(item => item.id === activeItem?.id);
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
          />
        </ScrollableContent>
      </SidebarContainer>
    </ThemeProvider>
  );
}

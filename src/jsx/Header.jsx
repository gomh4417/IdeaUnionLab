import styled from 'styled-components';
import { theme } from '../styles/theme';
import Icons from '../assets/Icons';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: ${theme.radius.max};
  width: fit-content;
  box-shadow: none;
  margin-bottom: 20px;
`;

const IconWrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  color: ${theme.colors.gray[800]};
`;

const HeaderText = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${theme.colors.gray[800]};
  line-height: 1;
`;

// type: 'back' | 'home'
export default function Header({ type = 'back', children, ...props }) {
  return (
    <HeaderContainer {...props}>
      <IconWrap>
        <Icons type={type} size={24} />
      </IconWrap>
      <HeaderText>{children}</HeaderText>
    </HeaderContainer>
  );
}

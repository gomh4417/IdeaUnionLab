import styled, { css } from 'styled-components';
import { theme } from '../styles/theme';
import Icons from './Icons';

const StyledBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  cursor: pointer;
  font-family: 'Pretendard', sans-serif;
  font-size: 18px;
  font-weight: 600;
  border-radius: ${theme.radius.max};
  box-shadow: ${theme.shadow};
  height: 52px;
  min-width: 138px;
  max-width: 138px;
  gap: 4px;
  background: ${theme.colors.primary};
  color: #fff;
  position: absolute;
  right: 32px;
  bottom: 36px;

  ${props => props.$type === 'disabled' && css`
    background: ${theme.colors.gray[400]};
    color: #F5F5F5;
    cursor: not-allowed;
    box-shadow: none;
  `}

  ${props => props.$type === 'icon' && css`
    min-width: 0;
    width: 96px;
    height: 96px;
    padding: 0;
    font-size: 0;
    background: ${theme.colors.primary};
    color: #fff;
    box-shadow: ${theme.shadow};
    justify-content: center;
  `}

  ${props => props.$type === 'delete' && css`
    min-width: 0;
    width: 52px;
    height: 52px;
    padding: 0;
    font-size: 0;
    background: #fff;
    color: ${theme.colors.primary};
    border: 1px solid ${theme.colors.primary};
    box-shadow: ${theme.shadow};
    justify-content: center;
  `}

  ${props => props.$type === 'outline' && css`
    background: #fff;
    color: ${theme.colors.primary};
    border: 1.5px solid ${theme.colors.primary};
    box-shadow: ${theme.shadow};
  `}
`;

export default function ActionBtn({ type = 'default', iconName, title, ...props }) {
  const isIconOnly = type === 'icon' || type === 'delete';
  return (
    <StyledBtn $type={type} disabled={type === 'disabled'} {...props}>
      {!isIconOnly && title}
      {iconName && <Icons type={iconName} size={24} />}
    </StyledBtn>
  );
}

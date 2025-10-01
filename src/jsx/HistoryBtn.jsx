import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import Icons from './Icons';

const StyledHistoryBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${theme.colors.gray[300]};
  color: ${theme.colors.gray[600]};
  border: none;
  border-radius: ${theme.radius.medium};
  cursor: pointer;
  outline: none;
  font-family: 'Pretendard', sans-serif;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.gray[400]};
    color: ${theme.colors.gray[700]};
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default function HistoryBtn({ onClick, ...props }) {
  return (
    <StyledHistoryBtn onClick={onClick} {...props}>
      <Icons type="source_notes" size={20} />
    </StyledHistoryBtn>
  );
}
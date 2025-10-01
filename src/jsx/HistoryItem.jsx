import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';

const ICONS = {
  creativity: '/creativity.svg',
  aesthetics: '/aesthetics.svg',
  usability: '/usability.svg',
};

const StyledHistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: ${theme.radius.small};
  transition: background-color 0.2s ease;
  font-size: 12px;
  font-weight: 500;
  color: ${theme.colors.gray[600]};
  line-height: 160%;

  &:hover {
    background-color: ${theme.colors.gray[200]};
  }
`;

const AdditiveIcon = styled.img`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`;

const ItemText = styled.span`
  white-space: nowrap;
`;

export default function HistoryItem({ 
  generation, 
  additiveType, 
  onClick,
  ...props 
}) {
  const iconSrc = ICONS[additiveType] || ICONS['creativity'];
  
  return (
    <StyledHistoryItem onClick={onClick} {...props}>
      <AdditiveIcon src={iconSrc} alt={`${additiveType} icon`} />
      <ItemText>{generation}차 생성물</ItemText>
    </StyledHistoryItem>
  );
}
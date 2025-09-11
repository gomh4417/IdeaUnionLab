import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import Icons from './Icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation } from 'react-router-dom';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: ${theme.radius.max};
  width: auto;
  max-width: fit-content;
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
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: opacity 0.2s;
  
  &:hover {
    opacity: ${props => props.$clickable ? 0.7 : 1};
  }
`;

const HeaderInput = styled.textarea`
  font-size: 16px;
  font-weight: 500;
  color: ${theme.colors.gray[800]};
  line-height: 1.2;
  border: none;
  outline: none;
  background: transparent;
  border-radius: 0;
  padding: 0;
  margin: 0;
  font-family: inherit;
  width: auto;
  min-width: 48px;
  max-width: 400px;
  cursor: text;
  resize: none;
  overflow: hidden;
  white-space: nowrap;
  
  /* 브라우저 기본 스타일 제거 */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: none;
  -webkit-box-shadow: none;
  -moz-box-shadow: none;
  
  &:focus {
    outline: 1px solid ${theme.colors.primary};
    padding: 4px;
    border: none;
    border-radius: ${theme.radius.small};
  }
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const EditIconWrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: ${props => props.$isFocused ? "0px" : "-8px"};
  transition: margin-left 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

// type: 'back' | 'home'
export default function Header({ type = 'back', children, showEditIcon = false, onSave, onClick }) {
  const [editValue, setEditValue] = useState(children || '');
  const [projectName, setProjectName] = useState(children || 'Project Name');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = React.useRef(null);
  const hiddenSpanRef = React.useRef(null);
  const location = useLocation();
  
  // URL에서 projectId 추출 또는 location.state에서 가져오기
  const getProjectId = React.useCallback(() => {
    const state = location.state;
    if (state?.projectId) {
      return state.projectId;
    }
    // URL 경로에서 projectId 추출 (예: /lab?projectId=proj_001)
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('projectId');
  }, [location.state, location.search]);

  // Firebase에서 프로젝트 이름 직접 로드 (캐싱으로 중복 호출 방지)
  useEffect(() => {
    let isMounted = true;
    
    const loadProjectName = async () => {
      const projectId = getProjectId();
      if (!projectId) {
        if (isMounted) {
          setProjectName(children || 'Project Name');
          setEditValue(children || 'Project Name');
        }
        return;
      }
      
      try {
        if (import.meta.env.DEV) {
          console.log('Header: Firebase에서 프로젝트 정보 로딩 시작:', projectId);
        }
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (projectDoc.exists() && isMounted) {
          const projectData = projectDoc.data();
          const name = projectData.title || projectData.name || 'Untitled Project';
          if (import.meta.env.DEV) {
            console.log('Header: 로드된 프로젝트 이름:', name);
          }
          setProjectName(name);
          setEditValue(name);
        } else if (isMounted) {
          setProjectName('Project Name');
          setEditValue('Project Name');
        }
      } catch (error) {
        console.error('Header: 프로젝트 정보 로딩 실패:', error);
        if (isMounted) {
          setProjectName(children || 'Project Name');
          setEditValue(children || 'Project Name');
        }
      }
    };
    
    loadProjectName();
    
    return () => {
      isMounted = false;
    };
  }, [location.state?.projectId, location.search, children, getProjectId]);

  // children이 변경될 때 fallback으로 사용 (Firebase 로드 실패 시)
  React.useEffect(() => {
    if (children && !getProjectId()) {
      setProjectName(children);
      setEditValue(children);
      if (import.meta.env.DEV) {
        console.log('Header: editValue 업데이트됨 (children):', children);
      }
    }
  }, [children, getProjectId]);

  // 텍스트 길이에 따른 textarea 너비 자동 조정
  const updateTextareaWidth = React.useCallback(() => {
    if (textareaRef.current && hiddenSpanRef.current) {
      hiddenSpanRef.current.textContent = editValue || 'Project Name';
      const textWidth = hiddenSpanRef.current.offsetWidth;
      const minWidth = 40;
      const maxWidth = 400;
      const finalWidth = Math.max(minWidth, Math.min(textWidth + 10, maxWidth));
      textareaRef.current.style.width = `${finalWidth}px`;
    }
  }, [editValue]);

  // editValue 변경 시 너비 업데이트
  React.useEffect(() => {
    updateTextareaWidth();
  }, [editValue, updateTextareaWidth]);

  const handleEditClick = () => {
    // 저장 모드: Firebase에 직접 저장 또는 onSave 콜백 호출
    const projectId = getProjectId();
    if (projectId && editValue.trim()) {
      saveProjectName(projectId, editValue.trim());
    } else if (onSave && editValue.trim()) {
      onSave(editValue.trim());
    }
  };

  // Firebase에 프로젝트 이름 저장
  const saveProjectName = async (projectId, newTitle) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        title: newTitle,
        updatedAt: new Date()
      });
      
      setProjectName(newTitle);
      if (import.meta.env.DEV) {
        console.log('Header: 프로젝트 이름 업데이트 완료:', newTitle);
      }
      
      // 추가로 onSave 콜백이 있다면 호출 (LabPage의 로컬 state 업데이트용)
      if (onSave) {
        onSave(newTitle);
      }
    } catch (error) {
      console.error('Header: 프로젝트 이름 업데이트 실패:', error);
      alert('프로젝트 이름 변경 중 오류가 발생했습니다.');
    }
  };

  const handleKeyPress = (e) => {
    e.stopPropagation(); // 이벤트 전파 방지
    
    if (e.key === 'Escape') {
      setEditValue(projectName || ''); // 원래 값으로 복원
    } else if (e.key === 'Enter') {
      e.preventDefault(); // Enter 키로 줄바꿈 방지
      handleEditClick(); // Enter 키로 저장
    }
  };

  const handleInputClick = (e) => {
    e.stopPropagation(); // textarea 클릭 시 이벤트 전파 방지
  };

  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleIconClick = (e) => {
    e.stopPropagation(); 
    if (onClick) {
      onClick();
    }
  };

  return (
    <HeaderContainer>
      {/* 텍스트 길이 측정용 숨겨진 span */}
      <span
        ref={hiddenSpanRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontSize: '16px',
          fontWeight: '500',
          fontFamily: 'inherit'
        }}
      />
      
      <IconWrap $clickable={!!onClick} onClick={onClick ? handleIconClick : undefined}>
        <Icons type={type} size={24} color={theme.colors.gray[500]} />
      </IconWrap>
      
      <HeaderInput
        ref={textareaRef}
        value={editValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onClick={handleInputClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        rows={1}
        
      />
      
      {showEditIcon && (
        <EditIconWrap onClick={handleEditClick} $isFocused={isFocused}>
          <Icons 
            type={isFocused ? "check_circle" : "edit_square"}
            size={20} 
            color={theme.colors.gray[400]}
            style={{
              transition: 'all 0.2s ease'
            }}
          />
        </EditIconWrap>
      )}
    </HeaderContainer>
  );
}

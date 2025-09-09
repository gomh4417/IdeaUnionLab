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

const HeaderInput = styled.input`
  font-size: 16px;
  font-weight: 500;
  color: ${theme.colors.gray[800]};
  line-height: 1.2;
  border: ${props => props.$isEditing ? `1px solid ${theme.colors.gray[400]}` : 'none'};
  outline: none;
  background: ${props => props.$isEditing ? '#fff' : 'transparent'};
  border-radius: ${props => props.$isEditing ? theme.radius.small : '0'};
  padding: ${props => props.$isEditing ? '6px 10px' : '0'};
  font-family: inherit;
  width: auto;
  min-width: 116px;
  max-width: 400px;
  cursor: ${props => props.disabled ? 'default' : 'text'};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  transition: all 0.2s ease;
  resize: none;
  
  &:focus {
    border-color: ${theme.colors.gray[500]};
  }
`;

const EditIconWrap = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

// type: 'back' | 'home'
export default function Header({ type = 'back', children, showEditIcon = false, onSave, onClick, ...props }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(children || '');
  const [projectName, setProjectName] = useState(children || 'Project Name');
  const inputRef = React.useRef(null);
  const location = useLocation();
  
  // URL에서 projectId 추출 또는 location.state에서 가져오기
  const getProjectId = () => {
    const state = location.state;
    if (state?.projectId) {
      return state.projectId;
    }
    // URL 경로에서 projectId 추출 (예: /lab?projectId=proj_001)
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('projectId');
  };

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
  }, [location.state?.projectId, location.search]);

  // children이 변경될 때 fallback으로 사용 (Firebase 로드 실패 시)
  React.useEffect(() => {
    if (children && !getProjectId()) {
      setProjectName(children);
      setEditValue(children);
      if (import.meta.env.DEV) {
        console.log('Header: editValue 업데이트됨 (children):', children);
      }
    }
  }, [children]);

  // 편집 모드가 활성화되면 input에 포커스
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // 텍스트 전체 선택
    }
  }, [isEditing]);

  const handleEditClick = () => {
    if (isEditing) {
      // 저장 모드: Firebase에 직접 저장 또는 onSave 콜백 호출
      const projectId = getProjectId();
      if (projectId && editValue.trim()) {
        saveProjectName(projectId, editValue.trim());
      } else if (onSave && editValue.trim()) {
        onSave(editValue.trim());
      }
      setIsEditing(false);
    } else {
      // 편집 모드 시작: 현재 값을 input에 설정하고 편집 활성화
      setEditValue(projectName || '');
      setIsEditing(true);
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

  const handleEditIconClick = (e) => {
    e.stopPropagation(); // 이벤트 전파 방지
    handleEditClick();
  };

  const handleKeyPress = (e) => {
    if (!isEditing) return; // 편집 모드가 아니면 키 입력 무시
    
    e.stopPropagation(); // 이벤트 전파 방지
    
    if (e.key === 'Escape') {
      setIsEditing(false); // ESC 키로 취소
      setEditValue(projectName || ''); // 원래 값으로 복원
    }
  };

  const handleInputClick = (e) => {
    if (!isEditing) return; // 편집 모드가 아니면 클릭 무시
    e.stopPropagation(); // input 클릭 시 이벤트 전파 방지
  };

  const handleInputChange = (e) => {
    if (!isEditing) return; 
    setEditValue(e.target.value);
  };

  // input 너비를 텍스트 길이에 맞춰 조정
  const getInputWidth = () => {
    const length = editValue.length;
    const minWidth = 136;
    const maxWidth = 400;
    const charWidth = 8.5; 
    const padding = isEditing ? 16 : 0; 
    
    const calculatedWidth = Math.max(minWidth, length * charWidth + padding);
    return Math.min(calculatedWidth, maxWidth);
  };

  const handleIconClick = (e) => {
    e.stopPropagation(); 
    if (onClick) {
      onClick();
    }
  };

  return (
    <HeaderContainer>
      <IconWrap $clickable={!!onClick} onClick={onClick ? handleIconClick : undefined}>
        <Icons type={type} size={24} color={theme.colors.gray[500]} />
      </IconWrap>
      <HeaderInput
        ref={inputRef}
        value={editValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onClick={handleInputClick}
        style={{ width: `${getInputWidth()}px` }}
        disabled={!isEditing}
        readOnly={!isEditing}
        $isEditing={isEditing}
      />
      {showEditIcon && (
        <EditIconWrap onClick={handleEditIconClick}>
          <Icons 
            type={isEditing ? "check_circle" : "edit_square"} 
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

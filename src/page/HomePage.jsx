import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextIdWithCounter } from '../utils/firebaseCounter';
import styled from 'styled-components';

import StartButton from '../jsx/StartButton';
import ProjectList from '../jsx/ProjectList';

const HomePageContainer = styled.div`
  position: relative;
  width: 1194px;
  height: 834px;
  margin: 0 auto;
  z-index: 1;
  
  /* 배경 이미지를 pseudo-element로 처리 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('/home_background.png');
    background-size: 1194px 834px;
    background-position: center;
    background-repeat: no-repeat;
    z-index: -1;
    pointer-events: none;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
`;

function HomePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const projectListRef = useRef(null);

    const handleStartNewExperiment = async () => {
        try {
            setLoading(true);
            
            // 카운터를 사용한 효율적인 ID 생성
            const { id: projectId } = await getNextIdWithCounter('counters/projects', 'proj');
            
            if (process.env.NODE_ENV === 'development') {
                console.log('생성될 프로젝트 ID:', projectId);
            }
            
            // 프로젝트 생성
            await setDoc(doc(db, "projects", projectId), {
                title: "새 프로젝트",
                name: "새 프로젝트", // 호환성을 위해 둘 다 저장
                description: "실험용 프로젝트",
                createdAt: new Date(),
            });
            
            if (process.env.NODE_ENV === 'development') {
                console.log('프로젝트 생성 완료:', projectId);
            }
            
            // LabPage로 이동
            navigate('/lab', { state: { projectId } });
        } catch (error) {
            console.error('프로젝트 생성 실패:', error);
            // 에러가 발생해도 일단 LabPage로 이동 (MVP용)
            navigate('/lab', { state: { projectId: 'temp_project' } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <HomePageContainer>
            <ContentWrapper>
                <StartButton 
                    onClick={handleStartNewExperiment}
                    disabled={loading}
                >
                    {loading ? '생성 중...' : '새로운 실험하기'}
                </StartButton>
                <ProjectList />
            </ContentWrapper>
        </HomePageContainer>
    );
}

export default HomePage

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextIdWithCounter } from '../utils/firebaseCounter';
import styled from 'styled-components';
import { motion } from "framer-motion";

import StartButton from '../jsx/StartButton';
import ProjectList from '../jsx/ProjectList';
import AnimatedPipes from '../jsx/AnimatedPipes';
import AnimatedLogos from '../jsx/AnimatedLogos';
import AnimatedSubPipes from '../jsx/AnimatedSubPipes';

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
    const [filled, setFilled] = useState(false);
    const projectListRef = useRef(null);
    const LIST_DELAY_AFTER_FILLED = 1;

    const handleStartNewExperiment = async () => {
        try {
            setLoading(true);
            
            // 카운터를 사용한 효율적인 ID 생성
            const { id: projectId } = await getNextIdWithCounter('counters/projects', 'proj');
            
            if (import.meta.env.DEV) {
                console.log('생성될 프로젝트 ID:', projectId);
            }
            
            // 프로젝트 생성
            await setDoc(doc(db, "projects", projectId), {
                title: "새 프로젝트",
                name: "새 프로젝트", // 호환성을 위해 둘 다 저장
                description: "실험용 프로젝트",
                createdAt: new Date(),
            });
            
            if (import.meta.env.DEV) {
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
        {/* StartButton */}
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={filled ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{
            delay: filled ? LIST_DELAY_AFTER_FILLED : 0, // 먼저 등장
            duration: 0.5,
            ease: [0.2, 0.0, 0.1, 1.0],
            }}
            style={{ willChange: 'opacity, transform' }}
        >
            <StartButton
            onClick={handleStartNewExperiment}
            disabled={loading}
            >
            {loading ? '생성 중...' : '새로운 실험하기'}
            </StartButton>
        </motion.div>

        {/* ProjectList */}
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={filled ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{
            delay: filled ? LIST_DELAY_AFTER_FILLED + 0.5 : 0, // 0.5초 늦게
            duration: 0.5,
            ease: [0.2, 0.0, 0.1, 1.0],
            }}
            style={{ willChange: 'opacity, transform' }}
        >
            <ProjectList />
        </motion.div>
        </ContentWrapper>

            <AnimatedLogos show={filled} delay={0} gap={0.1} />

            <AnimatedPipes
                baseOpacity={0}
                baseWidth={4}
                fluidWidth={19}
                duration={4}
                stagger={0.3}
                easing={[0.15, 0.0, 0.1, 0.6]}
                onFilled={() => setFilled(true)}
            />

            <AnimatedSubPipes
                startDelay={1.2}     
                baseColor="#E3E3E3" 
                baseOpacity={0}
                baseWidth={4}
                fluidWidth={19}
                duration={4}
                stagger={0.3}
                z={-55}               
            />

        </HomePageContainer>
    );
}

export default HomePage

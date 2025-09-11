
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// 프로젝트 아이템 컨테이너 스타일
const Container = styled(motion.div)`
    /* 기본 크기 설정 - 이미지 기준으로 수정 */
    width: 240px;  /* Default: 240px */
    height: 164px; /* Default: 164px */
    
    /* 컨테이너 모양 설정 */
    border-radius: ${({ $focused }) => $focused ? '10px' : '4px'};
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    background: #fff;
    
    /* 내부 콘텐츠 정렬 - 중앙 정렬로 설정 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    
    /* 내부 여백 설정 */
    padding: 20px 16px 16px 16px;
    box-sizing: border-box;
    
    /* 상호작용 효과 */
    cursor: pointer;
    box-shadow: ${({ $focused, theme }) => $focused ? theme.shadow : 'none'};
    
    /* 호버 효과 추가 */
    &:hover {
        border-color: ${({ theme }) => theme.colors.gray[400]};
        
    }
`;

// 프로젝트 제목 스타일
const Title = styled(motion.div)`
    /* 텍스트 정렬 */
    text-align: center;
    word-break: keep-all; /* 한글 단어 단위로 줄바꿈 */
    
    /* 폰트 설정 */
    font-weight: 500;
    line-height: 160%;
    color: ${({ theme }) => theme.colors.gray[900]};
    
    /* 포커스 상태에 따른 폰트 크기 변화 - 조정 가능 */
    font-size: ${({ $focused }) => $focused ? '24px' : '16px'}; 
    
    /* 폰트 크기 transition 추가 */
    transition: font-size 0.15s ease-in;
    
    /* 여백 설정 */
    margin-bottom: 2px;
    
    /* 텍스트 길이 제한 (선택사항) */
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
`;

// 프로젝트 날짜 스타일  
const DateText = styled(motion.div)`
    /* 텍스트 정렬 */
    text-align: center;
    border-bottom: 1px solid #eee;
    padding-bottom: ${({ $focused }) => $focused ? '12px' : '10px'};
    
    /* 폰트 설정 */
    font-weight: 400;
    line-height: 160%;
    color: ${({ theme }) => theme.colors.gray[500]};
    
    /* 포커스 상태에 따른 폰트 크기 변화 - 조정 가능 */
    font-size: ${({ $focused }) => $focused ? '16px' : '12px'}; 
    
    /* 폰트 크기와 패딩 transition 추가 */
    transition: font-size 0.15s ease-in;
    
    /* 상단 여백 */
    margin-top: 4px;
`;

// 아이디어 카운터 컨테이너 스타일
const IdeaCounterContainer = styled(motion.div)`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0px;
    width: 100%;
    margin-top: ${({ $focused }) => $focused ? '12px' : '6px'};
    
    /* 포커스 상태에서만 표시 */
    opacity: ${({ $focused }) => $focused ? 1 : 0.9};
    transform: ${({ $focused }) => $focused ? 'translateY(0)' : 'translateY(10px)'};
    
    /* 마진과 opacity, transform transition 추가 */
    transition: all 0.3s ease;
`;

// 개별 카운터 스타일
const CounterItem = styled.div`
    position: relative;
    width: ${({ $focused }) => $focused ? '72px' : '48px'};  /* Focused: 72px, Default: 48px */
    height: ${({ $focused }) => $focused ? '72px' : '48px'}; /* Focused: 72px, Default: 48px */
    display: flex;
    align-items: center;
    justify-content: center;
    
    /* 크기 transition 추가 */
    transition: all 0.3s ease;
`;

// 카운터 프레임 (테두리) 스타일
const CounterFrame = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${({ $focused }) => $focused ? '72px' : '48px'};   /* Frame 크기 */
    height: ${({ $focused }) => $focused ? '72px' : '48px'};  /* Frame 크기 */
    background-image: url(${({ $focused, $colorIndex }) => {
        if (!$focused) return '/countFrame-default.svg';
        return `/countFrame-brand${$colorIndex}.svg`;
    }});
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    z-index: 2;
 
    
`;

// 카운터 볼륨 (내부 채움) 스타일
const CounterVolume = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${({ $focused }) => $focused ? '72px' : '48px'};   /* Volume 크기 */
    height: ${({ $focused }) => $focused ? '72px' : '48px'};  /* Volume 크기 */
    background-image: url(${({ $focused, $colorIndex }) => {
        if (!$focused) return '/countVolume-default.svg';
        return `/countVolume-brand${$colorIndex}.svg`;
    }});
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    z-index: 1;
    
   
`;

// 카운터 숫자 스타일
const CounterNumber = styled.span`
    position: relative;
    z-index: 10;
    color: #fff;
    font-size: ${({ $focused }) => $focused ? '18px' : '10px'};
    font-weight: 500;
    text-align: center;
    margin-top: ${({ $focused }) => $focused ? '14px' : '8px'};

`;

export default function ProjectItem({ project, focused, animating, onClick }) {
    const navigate = useNavigate();
    const [additiveCounts, setAdditiveCounts] = useState({
        creativity: 0,
        usability: 0,
        aesthetics: 0
    });

    // Firebase에서 해당 프로젝트의 생성물 아이디어들을 실시간으로 가져와서 additiveType별로 카운트
    useEffect(() => {
        if (!project.id) return;

        let unsubscribe = null;
        
        try {
            // 해당 프로젝트의 생성물 아이디어들을 가져오는 쿼리
            const ideasQuery = query(
                collection(db, 'projects', project.id, 'ideas'),
                where('id', '>=', 'result_idea_'),
                where('id', '<', 'result_idea_\uf8ff')
            );

            unsubscribe = onSnapshot(ideasQuery, (snapshot) => {
                const counts = {
                    creativity: 0,
                    usability: 0,
                    aesthetics: 0
                };

                snapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    const additiveType = data.additiveType;
                    
                    if (additiveType && additiveType in counts) {
                        counts[additiveType]++;
                    }
                });

                setAdditiveCounts(counts);
            });
        } catch (error) {
            console.error('ProjectItem: additiveType 카운트 로딩 실패:', error);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [project.id]);
    
    // 프로젝트 클릭 시 처리
    const handleClick = (e) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        
        if (focused) {
            // 이미 포커스된 아이템이면 Lab 페이지로 이동
            if (project.id) {
                navigate('/lab', { state: { projectId: project.id } });
            } else {
                console.error('프로젝트 ID가 없습니다:', project);
            }
        } else {
            // 포커스되지 않은 아이템이면 중앙으로 이동 (지연된 포커스 변경)
            if (onClick) {
                onClick(); // ProjectList의 handleItemClick 호출 (내부에서 지연된 포커스 변경 처리)
            }
        }
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateField) => {
        if (!dateField) return 'Invalid Date';
        
        try {
            let date;
            if (dateField.toDate && typeof dateField.toDate === 'function') {
                // Firestore Timestamp
                date = dateField.toDate();
            } else if (dateField instanceof Date) {
                // JavaScript Date
                date = dateField;
            } else {
                // String이나 다른 형식
                date = new Date(dateField);
            }
            
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
        } catch (error) {
            console.error('날짜 형식 변환 실패:', error);
            return 'Invalid Date';
        }
    };
    
    return (
        <Container
            $focused={focused}
            onClick={handleClick}
            // 포커스 상태에 따른 크기 애니메이션 - 이미지 사이즈 기준
            animate={{
                width: focused ? 320 : 240,   // Focused: 320px, Default: 240px
                height: focused ? 220 : 164,  // Focused: 220px, Default: 164px  
                zIndex: focused ? 2 : 1,      // 포커스 시 앞으로 가져오기
            }}
            // 애니메이션 설정 - 부드러운 스프링 효과
            transition={{ 
                type: 'spring', 
                stiffness: 100,  // 애니메이션 강도 - 300에서 200으로 줄여 더 부드럽게
                damping: 10,     // 애니메이션 감쇠 - 30에서 25로 줄여 더 부드럽게
                mass: 0.5    // 질량 추가 - 더 자연스러운 움직임
            }}
            style={{
                margin: 0,
                flexShrink: 0,
                // 애니메이션 중일 때는 CSS transition 비활성화
                transition: animating ? 'none' : undefined,
            }}
        >
            {/* 프로젝트 제목 */}
            <Title $focused={focused}>
                {project.title}
            </Title>
            
            {/* 프로젝트 생성 날짜 */}
            <DateText $focused={focused}>
                {formatDate(project.createdAt || project.date)}
            </DateText>
            
            {/* 아이디어 카운터 (포커스 상태에서만 표시) */}
            <IdeaCounterContainer $focused={focused}>
                <CounterItem $focused={focused}>
                    <CounterVolume 
                        $focused={focused} 
                        $colorIndex={3}
                    />
                    <CounterFrame 
                        $focused={focused} 
                        $colorIndex={3}
                    />
                    <CounterNumber $focused={focused}>{additiveCounts.creativity}</CounterNumber>
                </CounterItem>
                
                <CounterItem $focused={focused}>
                    <CounterVolume 
                        $focused={focused} 
                        $colorIndex={2}
                    />
                    <CounterFrame 
                        $focused={focused} 
                        $colorIndex={2}
                    />
                    <CounterNumber $focused={focused}>{additiveCounts.usability}</CounterNumber>
                </CounterItem>
                
                <CounterItem $focused={focused}>
                    <CounterVolume 
                        $focused={focused} 
                        $colorIndex={1}
                    />
                    <CounterFrame 
                        $focused={focused} 
                        $colorIndex={1}
                    />
                    <CounterNumber $focused={focused}>{additiveCounts.aesthetics}</CounterNumber>
                </CounterItem>
            </IdeaCounterContainer>
        </Container>
    );

}

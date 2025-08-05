
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// 프로젝트 아이템 컨테이너 스타일
const Container = styled(motion.div)`
    /* 기본 크기 설정 - 수정 가능 */
    width: 228px;
    height: 160px;
    
    /* 컨테이너 모양 설정 */
    border-radius: ${({ $focused, theme }) => $focused ? theme.radius.large : theme.radius.medium};
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    background: #fff;
    
    /* 내부 콘텐츠 정렬 - 중앙 정렬로 설정 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center; /* 텍스트 중앙 정렬 추가 */
    
    /* 내부 여백 설정 - 텍스트가 가장자리에 붙지 않도록 */
    padding: 20px 16px; /* 상하 20px, 좌우 16px - 필요시 조정 가능 */
    box-sizing: border-box; /* padding 포함해서 크기 계산 */
    
    /* 상호작용 효과 */
    cursor: pointer;
    box-shadow: ${({ $focused, theme }) => $focused ? theme.shadow : 'none'};
    
    /* 호버 효과 추가 */
    &:hover {
        border-color: ${({ theme }) => theme.colors.gray[400]};
        transition: border-color 0.2s ease;
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
    font-size: ${({ $focused }) => $focused ? '24px' : '16px'}; /* 28px에서 24px로 줄임 */
    transition: font-size 0.3s ease;
    
    /* 여백 설정 */
    margin-bottom: 4px;
    
    /* 텍스트 길이 제한 (선택사항) */
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
`;

// 프로젝트 날짜 스타일  
const DateText = styled(motion.div)`
    /* 텍스트 정렬 */
    text-align: center;
    
    /* 폰트 설정 */
    font-weight: 400;
    line-height: 160%;
    color: ${({ theme }) => theme.colors.gray[500]};
    
    /* 포커스 상태에 따른 폰트 크기 변화 - 조정 가능 */
    font-size: ${({ $focused }) => $focused ? '16px' : '12px'}; /* 18px에서 16px로 줄임 */
    transition: font-size 0.3s ease;
    
    /* 상단 여백 */
    margin-top: 4px;
`;

export default function ProjectItem({ project, focused, animating, onClick }) {
    const navigate = useNavigate();
    
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
            // 포커스되지 않은 아이템이면 중앙으로 이동
            if (onClick) {
                onClick();
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
            // 포커스 상태에 따른 크기 애니메이션 - 조정 가능
            animate={{
                width: focused ? 328 : 228,   // 포커스 시 더 넓게
                height: focused ? 228 : 160,  // 포커스 시 더 높게
                zIndex: focused ? 2 : 1,      // 포커스 시 앞으로 가져오기
            }}
            // 애니메이션 설정 - 부드러운 스프링 효과
            transition={{ 
                type: 'spring', 
                stiffness: 300,  // 애니메이션 강도 - 높을수록 빠름
                damping: 30      // 애니메이션 감쇠 - 높을수록 빨리 멈춤
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
        </Container>
    );
// ...existing code...
}

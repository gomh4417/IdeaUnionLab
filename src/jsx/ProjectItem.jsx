
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Container = styled(motion.div)`
    width: 228px;
    height: 160px;
    border-radius: ${({ $focused, theme }) => $focused ? theme.radius.large : theme.radius.medium};
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fff;
    cursor: pointer;
    box-shadow: ${({ $focused, theme }) => $focused ? theme.shadow : 'none'};
`;

const Title = styled(motion.div)`
    font-weight: 500;
    line-height: 160%;
    color: ${({ theme }) => theme.colors.gray[900]};
`;

const DateText = styled(motion.div)`
    font-weight: 400;
    line-height: 160%;
    color: ${({ theme }) => theme.colors.gray[500]};
    margin-top: 4px;
`;

export default function ProjectItem({ project, focused, animating }) {
    const navigate = useNavigate();
    return (
        <Container
            $focused={focused}
            onClick={() => navigate('/lab')}
            animate={{
                width: focused ? 328 : 228,
                height: focused ? 228 : 160,
                zIndex: focused ? 2 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
                margin: 0,
                flexShrink: 0,
                transition: animating ? 'none' : undefined,
            }}
        >
            <Title
                animate={{ fontSize: focused ? 28 : 16 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >{project.title}</Title>
            <DateText
                animate={{ fontSize: focused ? 18 : 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >{project.date}</DateText>
        </Container>
    );
// ...existing code...
}

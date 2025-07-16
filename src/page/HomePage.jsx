import { useNavigate } from 'react-router-dom';

import StartButton from '../jsx/StartButton';
import ProjectList from '../jsx/ProjectList';

function HomePage() {
    const navigate = useNavigate();
    return (
        <>
            <StartButton onClick={() => navigate('/lab')}>
                새로운 실험하기
            </StartButton>
            <ProjectList />
        </>
    );
}

export default HomePage

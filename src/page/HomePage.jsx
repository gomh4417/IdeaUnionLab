import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

function HomePage() {
    const navigate = useNavigate();
    return (
        <>
            <Button onClick={() => navigate('/lab')}>
                새로운 실험하기
            </Button>
        </>
    );
}

export default HomePage

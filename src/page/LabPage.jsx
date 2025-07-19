import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../jsx/Sidebar';
import Header from '../jsx/Header';

function LabPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const projects = location.state?.projects || [];
    return (
        <div style={{ padding: '25px 32px 32px 32px' }}>
            <Header type="home" onClick={() => navigate('/')}>Project Name</Header>
            <Sidebar projects={projects} />
        </div>
    );
}

export default LabPage

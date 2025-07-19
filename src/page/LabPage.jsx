import { useNavigate } from 'react-router-dom';

import Sidebar from '../jsx/Sidebar';
import Header from '../jsx/Header';

function LabPage() {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '25px 32px 32px 32px' }}>
            <Header type="home" onClick={() => navigate('/')}>Project Name</Header>
            <Sidebar />
        </div>
    );
}

export default LabPage

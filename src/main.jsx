
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, styled } from 'styled-components'
import { theme } from './styles/theme'
import './index.css'
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const Wrapper = styled.div`
  width: 100vw;
  max-width: 1194px;
  height: 100vh;
  max-height: 834px;
  overflow: hidden;
  box-shadow: 0 0 0 100vw rgba(0, 0, 0, 0.5);
  position: relative;
  margin-left: 250px;
  margin-top:70px;
`

import HomePage from './page/HomePage'
import LabPage from './page/LabPage'
import ResultPage from './page/ResultPage'
import CanvasPage from './page/CanvasPage'

const AppWrapper = ({ children }) => {
  
  // 개발 환경에서만 StrictMode 사용
  if (import.meta.env.DEV) {
    return <StrictMode>{children}</StrictMode>;
  }
  return children;
};

createRoot(document.getElementById('root')).render(
  <AppWrapper>
    <DndProvider backend={HTML5Backend}>
      <ThemeProvider theme={theme}>
        <Wrapper>
          <Router basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/write" element={<CanvasPage />} />
              <Route path="/result" element={<ResultPage />} />
            </Routes>
          </Router>
        </Wrapper>
      </ThemeProvider>
    </DndProvider>
  </AppWrapper>
)

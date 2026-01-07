
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, styled } from 'styled-components'
import { theme } from './styles/theme'
import './index.css'
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import HomePage from './page/HomePage'
import LabPage from './page/LabPage'
import ResultPage from './page/ResultPage'
import CanvasPage from './page/CanvasPage'

const AppWrapper = ({ children }) => {
  

  if (import.meta.env.DEV) {
    return <StrictMode>{children}</StrictMode>;
  }
  return children;
};

createRoot(document.getElementById('root')).render(
  <AppWrapper>
    <DndProvider backend={HTML5Backend}>
      <ThemeProvider theme={theme}>
        
          <Router basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/write" element={<CanvasPage />} />
              <Route path="/result" element={<ResultPage />} />
            </Routes>
          </Router>
        
      </ThemeProvider>
    </DndProvider>
  </AppWrapper>
)

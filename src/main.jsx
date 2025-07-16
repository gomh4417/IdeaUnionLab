import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, styled } from 'styled-components'
import { theme } from './styles/theme'
import './index.css'

const Wrapper = styled.div`
  width: 100vw;
  max-width: 1194px;
  height: 100vh;
  max-height: 834px;
  overflow: hidden;
  box-shadow: 0 0 0 100vw rgba(0, 0, 0, 0.5);
`

import HomePage from './page/HomePage'
import LabPage from './page/LabPage'
import ResultPage from './page/ResultPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <Wrapper>
        <Router basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </Router>
      </Wrapper>
    </ThemeProvider>
  </StrictMode>
)

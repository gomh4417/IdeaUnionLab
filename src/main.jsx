import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { theme } from './styles/theme'
import './index.css'

import HomePage from './page/HomePage'
import LabPage from './page/LabPage'
import ResultPage from './page/ResultPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  </StrictMode>,
)

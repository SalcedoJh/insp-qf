import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GlobalStyles from './global.style.js'
import Header from './components/header/Header'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Header />
  </StrictMode>,
)

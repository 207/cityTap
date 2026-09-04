import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setupViewportHeight } from './utils/viewport.js'

// Set up viewport height handling for mobile browsers
setupViewportHeight();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

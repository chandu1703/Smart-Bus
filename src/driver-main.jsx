import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DriverApp from './DriverApp.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <DriverApp />
    </StrictMode>,
)

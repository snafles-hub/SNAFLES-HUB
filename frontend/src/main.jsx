import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('main.jsx starting...')
console.log('React version:', React.version)

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
} else {
  console.log('Creating React root...')
  // In test mode, disable animations/transitions to reduce flakiness
  if (import.meta.env.VITE_E2E) {
    const style = document.createElement('style')
    style.setAttribute('data-testid', 'e2e-disable-animations')
    style.textContent = `* { animation: none !important; transition: none !important; }`
    document.head.appendChild(style)
  }
  const root = ReactDOM.createRoot(rootElement)
  
  console.log('Rendering App component...')
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('App component rendered!')
}

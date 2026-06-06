import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FavorisProvider } from './context/FavorisContext'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavorisProvider>
          <App />
        </FavorisProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

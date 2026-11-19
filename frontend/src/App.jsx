import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import LandingPage from './pages/landing.jsx'
import Authentication from './pages/authentication.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

function App() {
  

  return (
    <>
      <Router>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication />} />
        </Routes>

        </AuthProvider>
      </Router>
    </>
  )
}

export default App

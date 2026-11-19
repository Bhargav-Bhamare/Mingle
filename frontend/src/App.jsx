import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import LandingPage from './pages/landing'


function App() {
  

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>


      </Router>
    </>
  )
}

export default App

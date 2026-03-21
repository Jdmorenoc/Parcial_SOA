import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './login_menu/LoginPage'
import RegisterPage from './register_menu/RegisterPage'
import ForgotPage from './forgot_menu/ForgotPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
      </Routes>
    </Router>
  )
}

export default App

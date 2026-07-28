import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Success from './pages/Success'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sucesso" element={<Success />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
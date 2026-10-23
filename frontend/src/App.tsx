import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import SecurityCheck from './pages/SecurityCheck'
import StudentDashboard from './pages/StudentDashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import Instruction from './pages/Instruction'
import Assessment from './pages/Assessment'
import Result from './pages/Result'
import { Navbar } from './components/Navbar'

function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/security-check" element={<SecurityCheck />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/assessment/:id/instructions" element={<Instruction />} />
            <Route path="/student/assessment/:id" element={<Assessment />} />
            <Route path="/student/result/:id" element={<Result />} />
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </Router>
  )
}

export default App

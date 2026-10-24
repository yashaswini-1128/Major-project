import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/useAuthStore'
import { AlertCircle, GraduationCap, UserCog, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import API_BASE from '@/lib/api'

export default function Login() {
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'student'
  const isStudent = role.toLowerCase() === 'student'

  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')

      if (data.user.role.toLowerCase() !== role.toLowerCase()) {
        throw new Error(`You are trying to log in as ${role} but your account is ${data.user.role}.`)
      }

      login(data.user, data.token)
      navigate(data.user.role === 'STUDENT' ? '/student/dashboard' : '/faculty/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── STUDENT REGISTER ───────────────────────────────────────────────────────
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Please enter your full name.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/student-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setRegisterSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── FACULTY REGISTER ───────────────────────────────────────────────────────
  const handleFacultyRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Please enter your full name.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      login(data.user, data.token)
      navigate('/faculty/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = isStudent
    ? (isRegisterMode ? handleStudentRegister : handleLogin)
    : (isRegisterMode ? handleFacultyRegister : handleLogin)

  // ── STUDENT REGISTER SUCCESS STATE ─────────────────────────────────────────
  if (isStudent && registerSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-[420px] border-none shadow-xl shadow-slate-200/50 rounded-xl bg-white text-center">
          <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center gap-4">
            <div className="bg-emerald-50 w-16 h-16 flex items-center justify-center rounded-full">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Registration Successful!</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your account is ready. You can now <span className="font-semibold text-slate-700">log in immediately</span>. Ask your faculty for the assessment access code when you're ready to take a test.
            </p>
            <Button
              className="mt-2 w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-11"
              onClick={() => { setRegisterSuccess(false); setIsRegisterMode(false); resetForm() }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── MAIN FORM ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-[420px] border-none shadow-xl shadow-slate-200/50 rounded-xl bg-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-teal-50 w-16 h-16 flex items-center justify-center rounded-full mb-4">
            {isStudent
              ? <GraduationCap className="w-8 h-8 text-teal-600" />
              : <UserCog className="w-8 h-8 text-teal-600" />}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            {isStudent
              ? (isRegisterMode ? 'Student Register' : 'Student Login')
              : (isRegisterMode ? 'Faculty Register' : 'Faculty Login')}
          </CardTitle>
          <CardDescription className="text-slate-500 mt-2">
            {isStudent
              ? (isRegisterMode
                  ? 'Create your account. Faculty will approve your access.'
                  : 'Enter your name, email and the password you registered with.')
              : (isRegisterMode
                  ? 'Create your faculty account to manage assessments.'
                  : 'Log in to manage assessments and student results.')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-red-50 text-red-600 border-none rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Name — only shown in register mode */}
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={isStudent ? 'Enter your full name' : 'Enter your full name'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="h-11 rounded-lg border-slate-200 focus-visible:ring-teal-600"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 rounded-lg border-slate-200 focus-visible:ring-teal-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isStudent && !isRegisterMode ? 'Enter your password' : 'Min. 6 characters'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-11 rounded-lg border-slate-200 focus-visible:ring-teal-600"
              />
            </div>

            {/* Confirm Password — register mode only */}
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-700 font-medium">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 rounded-lg border-slate-200 focus-visible:ring-teal-600"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-base mt-2"
              disabled={loading}
            >
              {loading
                ? (isRegisterMode ? 'Creating Account...' : 'Authenticating...')
                : (isRegisterMode ? 'Create Account' : 'Login')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(prev => !prev); resetForm() }}
            className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
          >
            {isRegisterMode
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
          </button>
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            ← Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

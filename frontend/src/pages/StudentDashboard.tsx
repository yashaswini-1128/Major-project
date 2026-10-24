import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuthStore } from '@/store/useAuthStore'
import { Microscope, ArrowRight, Dna, KeyRound, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import API_BASE from '@/lib/api'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuthStore()
  
  const [tests, setTests] = useState<any[]>([])
  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') {
      navigate('/')
      return
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/student/tests`, {
          headers: { 'x-user-role': 'STUDENT', 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setTests(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [user, navigate, token])

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      toast.error('Please fill in all fields.')
      return
    }
    if (pwForm.next.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New passwords do not match.')
      return
    }
    setPwLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/student/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'STUDENT',
          'x-user-id': user!.id,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password.')
      toast.success('Password changed successfully!')
      setPwOpen(false)
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const totalAvailable = tests.length
  const totalPara = tests.filter(t => t.subject.toLowerCase() === 'parasitology').length
  const totalMyco = tests.filter(t => t.subject.toLowerCase() === 'mycology').length

  return (
    <div className="flex-1 bg-[#F8FAFC] py-10 px-4 md:px-8 font-sans animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-widest text-teal-600 uppercase">
              Student Dashboard
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.name.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-slate-500 text-lg">
              Select a microbiology assessment to begin your virtual laboratory test
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <Dialog open={pwOpen} onOpenChange={(open) => { setPwOpen(open); if (!open) setPwForm({ current: '', next: '', confirm: '' }) }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg h-10 px-4">
                  <KeyRound className="w-4 h-4 mr-2" /> Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] rounded-xl">
                <DialogHeader>
                  <div className="mx-auto bg-teal-50 w-12 h-12 flex items-center justify-center rounded-full mb-2 mt-4">
                    <KeyRound className="w-6 h-6 text-teal-600" />
                  </div>
                  <DialogTitle className="text-center text-xl">Change Password</DialogTitle>
                  <DialogDescription className="text-center">
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="pw-current" className="text-slate-700 font-medium">Current Password</Label>
                    <Input
                      id="pw-current"
                      type="password"
                      placeholder="Enter current password"
                      className="rounded-lg"
                      value={pwForm.current}
                      onChange={e => setPwForm(prev => ({ ...prev, current: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pw-new" className="text-slate-700 font-medium">New Password</Label>
                    <Input
                      id="pw-new"
                      type="password"
                      placeholder="Min. 6 characters"
                      className="rounded-lg"
                      value={pwForm.next}
                      onChange={e => setPwForm(prev => ({ ...prev, next: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pw-confirm" className="text-slate-700 font-medium">Confirm New Password</Label>
                    <Input
                      id="pw-confirm"
                      type="password"
                      placeholder="Re-enter new password"
                      className="rounded-lg"
                      value={pwForm.confirm}
                      onChange={e => setPwForm(prev => ({ ...prev, confirm: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleChangePassword}
                    disabled={pwLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 rounded-lg h-11"
                  >
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg h-10 px-4 border border-slate-200"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm rounded-xl bg-white">
            <CardContent className="p-6 flex flex-col justify-center items-start">
              <p className="text-4xl font-black text-slate-900">{totalAvailable}</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Available Tests</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-xl bg-white">
            <CardContent className="p-6 flex flex-col justify-center items-start">
              <p className="text-4xl font-black text-slate-900">{totalPara}</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Parasitology</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-xl bg-white">
            <CardContent className="p-6 flex flex-col justify-center items-start">
              <p className="text-4xl font-black text-slate-900">{totalMyco}</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Mycology</p>
            </CardContent>
          </Card>
        </div>

        {/* Assessments Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Select Assessment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test: any) => (
              <Card key={test.id} className="border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-xl bg-white overflow-hidden flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-teal-50 text-teal-600 p-2 rounded-full">
                      {test.subject.toLowerCase() === 'parasitology' ? (
                        <Dna className="w-5 h-5" />
                      ) : (
                        <Microscope className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                      {test.subject}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{test.title}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-3">
                    Assigned by: <span className="text-slate-600">{test.faculty?.name || 'Faculty'}</span>
                  </p>
                  
                  <p className="text-sm text-slate-500 mb-6 flex-1">
                    Identify {test.subject.toLowerCase()} laboratory specimens from provided images.
                  </p>
                  
                  <Button 
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg"
                    onClick={() => navigate(`/student/assessment/${test.id}/instructions`)}
                  >
                    Start Test <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  )
}

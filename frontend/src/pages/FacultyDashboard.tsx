import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, FileText, Settings, LogOut, CheckCircle, XCircle, LayoutDashboard, Download, BookOpen, Activity, Plus, Trash2, ImagePlus, Pen, BarChart2, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [students, setStudents] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [tests, setTests] = useState<any[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' })
  const [addingStudent, setAddingStudent] = useState(false)
  const [durationDialogOpen, setDurationDialogOpen] = useState(false)
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [testDuration, setTestDuration] = useState('60')
  const [testAccessCode, setTestAccessCode] = useState('')
  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false)
  const [newTest, setNewTest] = useState({ title: '', subject: '', duration: 60, accessCode: '', questions: [] as any[] })
  // Editing state for assessments
  const [editingTestId, setEditingTestId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  // Scores
  const [scoresModal, setScoresModal] = useState<{ open: boolean; testTitle: string; attempts: any[]; totalMarks: number }>({ open: false, testTitle: '', attempts: [], totalMarks: 0 })

  // Helper to build blank question
  const blankQuestion = () => ({ text: '', correctAnswer: '', hintText: '', imageUrl: '', imageFiles: [] as File[], imagePreviews: [] as string[] })

  useEffect(() => {
    if (!user || user.role !== 'FACULTY') {
      navigate('/')
      return
    }
    fetchData()
  }, [user, navigate, token])

  const fetchData = async () => {
    try {
      const [studentsRes, reportsRes, testsRes] = await Promise.all([
        fetch('http://localhost:5000/api/faculty/students', { headers: { 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/faculty/reports', { headers: { 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/faculty/tests', { headers: { 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` } })
      ])
      
      setStudents(await studentsRes.json())
      setReports(await reportsRes.json())
      setTests(await testsRes.json())
    } catch (err) {
      console.error(err)
      toast.error('Failed to load dashboard data')
    }
  }

  const fetchScores = async (testId: string, testTitle: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/faculty/tests/${testId}/scores`, {
        headers: { 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setScoresModal({ open: true, testTitle, attempts: data.attempts || [], totalMarks: data.totalMarks || 0 })
    } catch {
      toast.error('Failed to load scores')
    }
  }

  const toggleAccess = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`http://localhost:5000/api/faculty/students/${id}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isAllowed: !currentStatus })
      })
      fetchData()
      toast.success('Student access updated')
    } catch (err) {
      toast.error('Failed to update access')
    }
  }

  const toggleTestStatus = async (id: string, currentStatus: boolean, duration?: number) => {
    try {
      const body: any = { enabled: !currentStatus }
      if (duration !== undefined) {
        body.duration = duration
      }
      
      await fetch(`http://localhost:5000/api/faculty/tests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      })
      fetchData()
      toast.success('Test status updated')
      setDurationDialogOpen(false)
    } catch (err) {
      toast.error('Failed to update test')
    }
  }

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/faculty/students/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(`${name} removed successfully.`)
      fetchData()
    } catch {
      toast.error('Failed to delete student.')
    }
  }

  const handleEnableClick = (id: string) => {
    setSelectedTestId(id)
    setTestDuration('60')
    setTestAccessCode('')
    setDurationDialogOpen(true)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.email.trim() || !newStudent.password.trim()) {
      toast.error('Please fill in all fields.')
      return
    }
    setAddingStudent(true)
    try {
      const res = await fetch('http://localhost:5000/api/faculty/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newStudent)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add student.')
      toast.success(`Student "${data.name}" added successfully!`)
      setIsAddOpen(false)
      setNewStudent({ name: '', email: '', password: '' })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAddingStudent(false)
    }
  }

  const handleCreateTest = async () => {
    if (!newTest.title || !newTest.subject || newTest.questions.length === 0) {
      toast.error("Please fill all required fields and add at least one question.");
      return;
    }
    try {
      const updatedQuestions = await Promise.all(newTest.questions.map(async (q) => {
        // Upload images for this question
        let imageUrl = q.imageUrl;
        if (q.imageFiles && q.imageFiles.length > 0) {
          const urls = await Promise.all(q.imageFiles.map(async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);
            const uploadRes = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            return uploadData.imageUrl;
          }));
          imageUrl = JSON.stringify(urls);
        }

        const qtype = q.type || q.answerType || 'typed';
        const marks = q.marks ?? 1;

        if (qtype === 'scenario') {
          return {
            type: 'scenario', answerType: 'scenario',
            scenarioText: q.scenarioText || '',
            imageUrl,
            subQuestions: q.subQuestions || [],
            marks,
            text: '', correctAnswer: '', hintText: ''
          };
        }
        if (qtype === 'options') {
          return {
            type: 'options', answerType: 'options',
            text: q.text || '',
            correctAnswer: q.correctAnswer || '',
            hintText: q.hintText || '',
            options: q.options || [],
            imageUrl,
            marks
          };
        }
        return {
          type: 'typed', answerType: 'typed',
          text: q.text || '',
          correctAnswer: q.correctAnswer || '',
          hintText: q.hintText || '',
          imageUrl,
          marks
        };
      }));

      const res = await fetch('http://localhost:5000/api/faculty/tests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-user-role': 'FACULTY', 
          'x-user-id': user?.id || '',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: newTest.title,
          subject: newTest.subject,
          duration: newTest.duration,
          accessCode: newTest.accessCode || null,
          questions: updatedQuestions
        })
      });
      if (res.ok) {
        toast.success("Test created successfully!");
        setIsCreateTestOpen(false);
        setNewTest({ title: '', subject: '', duration: 60, accessCode: '', questions: [] });
        fetchData();
      } else {
        toast.error("Failed to create test");
      }
    } catch (e) {
      toast.error("Error creating test");
    }
  };

  // Update existing test
  const handleUpdateTest = async () => {
    if (!editingTestId) return;
    if (!newTest.title || !newTest.subject || newTest.questions.length === 0) {
      toast.error("Please fill all required fields and add at least one question.");
      return;
    }
    try {
      const updatedQuestions = await Promise.all(newTest.questions.map(async (q) => {
        let imageUrl = q.imageUrl;
        if (q.imageFiles && q.imageFiles.length > 0) {
          const urls = await Promise.all(q.imageFiles.map(async (file: File) => {
            const formData = new FormData();
            formData.append('image', file);
            const uploadRes = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            return uploadData.imageUrl;
          }));
          imageUrl = JSON.stringify(urls);
        }
        const qtype = q.type || q.answerType || 'typed';
        const marks = q.marks ?? 1;
        if (qtype === 'scenario') {
          return { type: 'scenario', answerType: 'scenario', scenarioText: q.scenarioText || '', imageUrl, subQuestions: q.subQuestions || [], marks, text: '', correctAnswer: '', hintText: '' };
        }
        if (qtype === 'options') {
          return { type: 'options', answerType: 'options', text: q.text || '', correctAnswer: q.correctAnswer || '', hintText: q.hintText || '', options: q.options || [], imageUrl, marks };
        }
        return { type: 'typed', answerType: 'typed', text: q.text || '', correctAnswer: q.correctAnswer || '', hintText: q.hintText || '', imageUrl, marks };
      }));
      const res = await fetch(`http://localhost:5000/api/faculty/tests/${editingTestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'FACULTY',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTest.title,
          subject: newTest.subject,
          duration: Number(testDuration) || newTest.duration,
          accessCode: testAccessCode || newTest.accessCode || null,
          questions: updatedQuestions
        })
      });
      if (res.ok) {
        toast.success('Test updated successfully!');
        setIsEditOpen(false);
        setEditingTestId(null);
        setNewTest({ title: '', subject: '', duration: 60, accessCode: '', questions: [] });
        fetchData();
      } else {
        toast.error('Failed to update test');
      }
    } catch (e) {
      toast.error('Error updating test');
    }
  };

  const handleDeleteTest = async (id: string, title: string) => {
    if (!window.confirm(`Delete assessment "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/faculty/tests/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(`${title} removed successfully.`);
      fetchData();
    } catch {
      toast.error('Failed to delete assessment.');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-white text-slate-900 p-6 flex flex-col min-h-screen border-r border-slate-200 z-10">
        <div className="mb-10 pt-4">
          <p className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">FACULTY DASHBOARD</p>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome, {user?.name.split(' ')[0]} 👋</h2>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${activeTab === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard className="w-5 h-5" /><span>Overview</span>
          </button>
          <button onClick={() => setActiveTab('access')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${activeTab === 'access' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Users className="w-5 h-5" /><span>Student Access Management</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${activeTab === 'reports' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <FileText className="w-5 h-5" /><span>Student Marks & Reports</span>
          </button>
          <button onClick={() => setActiveTab('assessments')} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${activeTab === 'assessments' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Settings className="w-5 h-5" /><span>Assessment Management</span>
          </button>
        </nav>

        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl py-6 border border-slate-200">
          <LogOut className="w-5 h-5 mr-3" />Logout
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
              <p className="text-slate-500 mt-1">A high-level view of system activity and metrics.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{students.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Tests</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{tests.filter(t => t.enabled).length}</p>
                  </div>
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-slate-100 shadow-sm bg-white rounded-xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Attempts</p>
                    <p className="text-4xl font-black text-slate-900 mt-2">{reports.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <Activity className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Access Management</h1>
                <p className="text-slate-500 mt-1">Manage which students are allowed to log in and take tests.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-10 px-4">
                    <Plus className="w-4 h-4 mr-2" /> Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-xl">
                  <DialogHeader>
                    <div className="mx-auto bg-teal-50 w-12 h-12 flex items-center justify-center rounded-full mb-2 mt-4">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Add New Student</DialogTitle>
                    <DialogDescription className="text-center">
                      Create a student account. They can log in with any personal email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="s-name" className="text-slate-700 font-medium">Full Name</Label>
                      <Input
                        id="s-name"
                        placeholder="e.g. Yashaswini K"
                        className="rounded-lg"
                        value={newStudent.name}
                        onChange={e => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-email" className="text-slate-700 font-medium">Email Address</Label>
                      <Input
                        id="s-email"
                        type="email"
                        placeholder="e.g. student@gmail.com"
                        className="rounded-lg"
                        value={newStudent.email}
                        onChange={e => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-password" className="text-slate-700 font-medium">Password</Label>
                      <Input
                        id="s-password"
                        type="password"
                        placeholder="Set a password for the student"
                        className="rounded-lg"
                        value={newStudent.password}
                        onChange={e => setNewStudent(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddStudent}
                      disabled={addingStudent}
                      className="w-full bg-teal-600 hover:bg-teal-700 rounded-lg h-11"
                    >
                      {addingStudent ? 'Adding...' : 'Add Student'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-white">
              <CardContent className="p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-5 font-semibold text-slate-600 text-sm">Student Name</th>
                      <th className="p-5 font-semibold text-slate-600 text-sm">Email</th>
                      <th className="p-5 font-semibold text-slate-600 text-sm">Status</th>
                      <th className="p-5 font-semibold text-slate-600 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student: any) => (
                      <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-5 font-medium text-slate-800">{student.name}</td>
                        <td className="p-5 text-slate-500">{student.email}</td>
                        <td className="p-5">
                          {student.isAllowed ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-semibold">
                              Allowed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 px-3 py-1 font-semibold">
                              Restricted
                            </Badge>
                          )}
                        </td>
                        <td className="p-5 text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-slate-700 border-slate-200 rounded-lg hover:bg-slate-50"
                            onClick={() => toggleAccess(student.id, student.isAllowed)}
                          >
                            {student.isAllowed ? 'Restrict' : 'Allow'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Marks & Reports</h1>
                <p className="text-slate-500 mt-1">View student scores and proctoring logs.</p>
              </div>
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 h-10">
                <a href="http://localhost:5000/api/faculty/reports/export" target="_blank" rel="noreferrer">
                  <Download className="w-4 h-4 mr-2" /> Export to Excel
                </a>
              </Button>
            </div>
            
            <Card className="border border-slate-100 shadow-sm rounded-xl bg-white">
              <CardContent className="p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-5 font-semibold text-slate-600 text-sm">Student</th>
                      <th className="p-5 font-semibold text-slate-600 text-sm">Test</th>
                      <th className="p-5 font-semibold text-slate-600 text-sm">Score</th>
                      <th className="p-5 font-semibold text-slate-600 text-sm">Status</th>
                      <th className="p-5 font-semibold text-slate-600 text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report: any) => (
                      <tr key={report.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-5">
                          <p className="font-medium text-slate-800">{report.student.name}</p>
                          <p className="text-xs text-slate-500">{report.student.email}</p>
                        </td>
                        <td className="p-5">
                          <p className="font-medium text-slate-700">{report.test.title}</p>
                        </td>
                        <td className="p-5 font-bold text-lg text-slate-800">{report.score ?? '-'}</td>
                        <td className="p-5">
                          {report.status === 'COMPLETED' ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 mb-1">Terminated</Badge>
                              {report.terminationReason && (
                                <span className="text-xs font-semibold text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded-md border border-rose-100">
                                  {report.terminationReason === 'EXIT_FULLSCREEN' ? 'Exited Full Screen' : 
                                   report.terminationReason === 'LEFT_AREA' ? 'Left Location Area' : 
                                   report.terminationReason === 'MULTIPLE_FACES' ? 'Multiple Faces Detected' : 
                                   report.terminationReason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-5 text-sm text-slate-500">
                          {new Date(report.startedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assessment Management</h1>
                <p className="text-slate-500 mt-1">Enable or disable tests, and create new assessments.</p>
              </div>
              <Dialog open={isCreateTestOpen} onOpenChange={setIsCreateTestOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 h-10">
                    <Plus className="w-4 h-4 mr-2" /> Create Assessment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Create New Assessment</DialogTitle>
                    <DialogDescription>
                      Fill out the details and add questions to create a new test.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Test Title</Label>
                        <Input placeholder="e.g., Midterm Exam" value={newTest.title} onChange={e => setNewTest({...newTest, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Subject</Label>
                        <Input placeholder="e.g., Parasitology" value={newTest.subject} onChange={e => setNewTest({...newTest, subject: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-slate-900 font-bold text-lg">Questions ({newTest.questions.length})</Label>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm"
                            onClick={() => setNewTest({...newTest, questions: [...newTest.questions, { type: 'typed', answerType: 'typed', text: '', correctAnswer: '', hintText: '', imageUrl: '', imageFiles: [], imagePreviews: [] }]})}>
                            <Plus className="w-4 h-4 mr-1" /> Typed Answer
                          </Button>
                          <Button variant="outline" size="sm" className="border-violet-300 text-violet-700 hover:bg-violet-50"
                            onClick={() => setNewTest({...newTest, questions: [...newTest.questions, { type: 'options', answerType: 'options', text: '', correctAnswer: '', hintText: '', imageUrl: '', imageFiles: [], imagePreviews: [], options: [{label:'A',text:''},{label:'B',text:''},{label:'C',text:''},{label:'D',text:''}] }]})}>
                            <Plus className="w-4 h-4 mr-1" /> MCQ Options
                          </Button>
                          <Button variant="outline" size="sm" className="border-teal-300 text-teal-700 hover:bg-teal-50"
                            onClick={() => setNewTest({...newTest, questions: [...newTest.questions, { type: 'scenario', answerType: 'scenario', scenarioText: '', imageFiles: [], imagePreviews: [], imageUrl: '', subQuestions: [{ text: '', correctAnswer: '', hintText: '' }] }]})}>
                            <Plus className="w-4 h-4 mr-1" /> Case Scenario
                          </Button>
                        </div>
                      </div>

                      {newTest.questions.map((q, index) => {
                        const qtype = q.type || q.answerType || 'typed'
                        const borderCls = qtype === 'scenario' ? 'border-teal-200 bg-teal-50/40' : qtype === 'options' ? 'border-violet-200 bg-violet-50/30' : 'border-slate-200 bg-slate-50'
                        const badgeCls = qtype === 'scenario' ? 'bg-teal-100 text-teal-700' : qtype === 'options' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
                        const badgeLabel = qtype === 'scenario' ? '📋 Case Scenario' : qtype === 'options' ? '🔘 MCQ Options' : '✏️ Typed Answer'
                        return (
                        <div key={index} className={`p-4 border rounded-xl space-y-4 relative ${borderCls}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeCls}`}>{badgeLabel}</span>
                              <p className="font-bold text-slate-700 text-sm">#{index + 1}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => setNewTest({...newTest, questions: newTest.questions.filter((_, i) => i !== index)})}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                            {/* Marks per question */}
                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                              <Label className="text-amber-700 font-semibold text-xs uppercase tracking-wider shrink-0">Marks:</Label>
                              <Input type="number" min="0.5" step="0.5" className="w-20 h-7 text-sm font-bold text-center border-amber-200 bg-white" value={q.marks ?? 1} onChange={e => { const qs = [...newTest.questions]; qs[index].marks = parseFloat(e.target.value) || 1; setNewTest({...newTest, questions: qs}); }} />
                            </div>

                          {qtype === 'scenario' ? (
                            <>
                              <div className="space-y-1">
                                <Label className="text-slate-700 font-medium text-sm">Case Scenario Description</Label>
                                <textarea rows={4} placeholder="e.g. A 40 year old HIV+ patient presented with white patches..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" value={q.scenarioText || ''} onChange={e => { const qs = [...newTest.questions]; qs[index].scenarioText = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Scenario Specimen Images</Label>
                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-teal-300 rounded-xl bg-white hover:bg-teal-50 cursor-pointer transition-colors">
                                  <span className="text-sm text-teal-600 font-medium">Click to attach images</span>
                                  <span className="text-xs text-teal-400 mt-0.5">Clinical photos, microscopy, culture media, etc.</span>
                                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (!files.length) return; const previews = files.map(f => URL.createObjectURL(f)); const qs = [...newTest.questions]; qs[index].imageFiles = [...(qs[index].imageFiles || []), ...files]; qs[index].imagePreviews = [...(qs[index].imagePreviews || []), ...previews]; setNewTest({...newTest, questions: qs}); e.target.value = ''; }} />
                                </label>
                                {q.imagePreviews && q.imagePreviews.length > 0 && (<div className="grid grid-cols-4 gap-2">{q.imagePreviews.map((src: string, imgIdx: number) => (<div key={imgIdx} className="relative group rounded-lg overflow-hidden border border-teal-200 aspect-square"><img src={src} alt="" className="w-full h-full object-cover" /><button type="button" className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { const qs = [...newTest.questions]; qs[index].imageFiles = qs[index].imageFiles.filter((_: any, i: number) => i !== imgIdx); qs[index].imagePreviews = qs[index].imagePreviews.filter((_: any, i: number) => i !== imgIdx); setNewTest({...newTest, questions: qs}); }}>&times;</button></div>))}</div>)}
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-slate-700 font-semibold text-sm">Sub-Questions ({(q.subQuestions || []).length})</Label>
                                  <Button variant="outline" size="sm" className="text-teal-700 border-teal-300 hover:bg-teal-50 h-7 text-xs" onClick={() => { const qs = [...newTest.questions]; qs[index].subQuestions = [...(qs[index].subQuestions || []), { text: '', correctAnswer: '', hintText: '' }]; setNewTest({...newTest, questions: qs}); }}>
                                    <Plus className="w-3 h-3 mr-1" /> Add Sub-question
                                  </Button>
                                </div>
                                {(q.subQuestions || []).map((sq: any, sqIdx: number) => (
                                  <div key={sqIdx} className="bg-white border border-teal-100 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-teal-600">{sqIdx + 1}.</span><button type="button" className="text-rose-400 hover:text-rose-600 text-xs" onClick={() => { const qs = [...newTest.questions]; qs[index].subQuestions = qs[index].subQuestions.filter((_: any, si: number) => si !== sqIdx); setNewTest({...newTest, questions: qs}); }}>Remove</button></div>
                                    <Input placeholder={`Sub-question ${sqIdx + 1} text`} value={sq.text} onChange={e => { const qs = [...newTest.questions]; qs[index].subQuestions[sqIdx].text = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input placeholder="Expected Answer / Key Points" value={sq.correctAnswer} onChange={e => { const qs = [...newTest.questions]; qs[index].subQuestions[sqIdx].correctAnswer = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                                      <Input placeholder="Hint (optional)" value={sq.hintText} onChange={e => { const qs = [...newTest.questions]; qs[index].subQuestions[sqIdx].hintText = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : qtype === 'options' ? (
                            <>
                              <Input placeholder="Question Text" value={q.text || ''} onChange={e => { const qs = [...newTest.questions]; qs[index].text = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                              <div className="space-y-2">
                                <Label className="text-slate-700 font-medium text-sm">Answer Options (A / B / C / D)</Label>
                                {(q.options || [{label:'A',text:''},{label:'B',text:''},{label:'C',text:''},{label:'D',text:''}]).map((opt: any, oIdx: number) => (
                                  <div key={oIdx} className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center shrink-0">{opt.label}</span>
                                    <Input placeholder={`Option ${opt.label}`} value={opt.text || ''} onChange={e => { const qs = [...newTest.questions]; if (!qs[index].options) qs[index].options = [{label:'A',text:''},{label:'B',text:''},{label:'C',text:''},{label:'D',text:''}]; qs[index].options[oIdx].text = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-slate-700 text-sm font-medium">Correct Answer</Label>
                                  <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" value={q.correctAnswer || ''} onChange={e => { const qs = [...newTest.questions]; qs[index].correctAnswer = e.target.value; setNewTest({...newTest, questions: qs}); }}>
                                    <option value="">Select correct option</option>
                                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                  </select>
                                </div>
                                <Input placeholder="Hint (optional)" value={q.hintText || ''} onChange={e => { const qs = [...newTest.questions]; qs[index].hintText = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Specimen Images (optional)</Label>
                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-violet-300 rounded-xl bg-white hover:bg-violet-50 cursor-pointer transition-colors">
                                  <span className="text-sm text-violet-600 font-medium">Click to attach images</span>
                                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (!files.length) return; const previews = files.map(f => URL.createObjectURL(f)); const qs = [...newTest.questions]; qs[index].imageFiles = [...(qs[index].imageFiles || []), ...files]; qs[index].imagePreviews = [...(qs[index].imagePreviews || []), ...previews]; setNewTest({...newTest, questions: qs}); e.target.value = ''; }} />
                                </label>
                                {q.imagePreviews && q.imagePreviews.length > 0 && (<div className="grid grid-cols-4 gap-2">{q.imagePreviews.map((src: string, imgIdx: number) => (<div key={imgIdx} className="relative group rounded-lg overflow-hidden border border-violet-200 aspect-square"><img src={src} alt="" className="w-full h-full object-cover" /><button type="button" className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { const qs = [...newTest.questions]; qs[index].imageFiles = qs[index].imageFiles.filter((_: any, i: number) => i !== imgIdx); qs[index].imagePreviews = qs[index].imagePreviews.filter((_: any, i: number) => i !== imgIdx); setNewTest({...newTest, questions: qs}); }}>&times;</button></div>))}</div>)}
                            </div>
                            </>
                          ) : (
                            <>
                              <Input placeholder="Question Text" value={q.text || ''} onChange={e => { const qs = [...newTest.questions]; qs[index].text = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                              <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="Correct Answer" value={q.correctAnswer || ''} onChange={e => { const qs = [...newTest.questions]; qs[index].correctAnswer = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                                <Input placeholder="Hint (optional)" value={q.hintText || ''} onChange={e => { const qs = [...newTest.questions]; qs[index].hintText = e.target.value; setNewTest({...newTest, questions: qs}); }} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Specimen Images (optional)</Label>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                                  <span className="text-sm text-slate-500 font-medium">Click to select images</span>
                                  <span className="text-xs text-slate-400 mt-1">Multiple files allowed</span>
                                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (!files.length) return; const previews = files.map(f => URL.createObjectURL(f)); const qs = [...newTest.questions]; qs[index].imageFiles = [...(qs[index].imageFiles || []), ...files]; qs[index].imagePreviews = [...(qs[index].imagePreviews || []), ...previews]; setNewTest({...newTest, questions: qs}); e.target.value = ''; }} />
                                </label>
                                {q.imagePreviews && q.imagePreviews.length > 0 && (<div className="grid grid-cols-4 gap-2">{q.imagePreviews.map((src: string, imgIdx: number) => (<div key={imgIdx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square"><img src={src} alt="" className="w-full h-full object-cover" /><button type="button" className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { const qs = [...newTest.questions]; qs[index].imageFiles = qs[index].imageFiles.filter((_: any, i: number) => i !== imgIdx); qs[index].imagePreviews = qs[index].imagePreviews.filter((_: any, i: number) => i !== imgIdx); setNewTest({...newTest, questions: qs}); }}>&times;</button></div>))}</div>)}
                              </div>
                            </>
                          )}
                        </div>
                        )}
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateTestOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTest} className="bg-teal-600 hover:bg-teal-700 text-white">Save Assessment</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
        {/* Edit Assessment Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit Assessment</DialogTitle>
              <DialogDescription>Edit the assessment details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Reuse the same form fields as creation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Test Title</Label>
                  <Input placeholder="e.g., Midterm Exam" value={newTest.title} onChange={e => setNewTest({ ...newTest, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Subject</Label>
                  <Input placeholder="e.g., Parasitology" value={newTest.subject} onChange={e => setNewTest({ ...newTest, subject: e.target.value })} />
                </div>
              </div>
              {/* Questions section — supports Standard & Case Scenario */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-slate-900 font-bold text-lg">Questions ({newTest.questions.length})</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setNewTest({ ...newTest, questions: [...newTest.questions, { type: 'standard', text: '', correctAnswer: '', hintText: '', imageUrl: '', imageFiles: [], imagePreviews: [] }] })}>
                      <Plus className="w-4 h-4 mr-1" /> Standard
                    </Button>
                    <Button variant="outline" size="sm" className="border-teal-300 text-teal-700 hover:bg-teal-50" onClick={() => setNewTest({ ...newTest, questions: [...newTest.questions, { type: 'scenario', scenarioText: '', imageFiles: [], imagePreviews: [], imageUrl: '', subQuestions: [{ text: '', correctAnswer: '', hintText: '' }] }] })}>
                      <Plus className="w-4 h-4 mr-1" /> Case Scenario
                    </Button>
                  </div>
                </div>
                {newTest.questions.map((q, index) => {
                  const qtype = q.type || q.answerType || 'typed'
                  return (
                  <div key={index} className={`p-4 border rounded-xl space-y-4 ${ qtype === 'scenario' ? 'border-teal-200 bg-teal-50/40' : qtype === 'options' ? 'border-violet-200 bg-violet-50/30' : 'border-slate-200 bg-slate-50' }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ qtype === 'scenario' ? 'bg-teal-100 text-teal-700' : qtype === 'options' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600' }`}>
                          {qtype === 'scenario' ? '📋 Case Scenario' : qtype === 'options' ? '🔘 MCQ Options' : '✏️ Typed Answer'}
                        </span>
                        <p className="font-bold text-slate-700 text-sm">#{index + 1}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => setNewTest({ ...newTest, questions: newTest.questions.filter((_, i) => i !== index) })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Marks per question */}
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <Label className="text-amber-700 font-semibold text-xs uppercase tracking-wider shrink-0">Marks:</Label>
                      <Input type="number" min="0.5" step="0.5" className="w-20 h-7 text-sm font-bold text-center border-amber-200 bg-white" value={q.marks ?? 1} onChange={e => { const qs = [...newTest.questions]; qs[index].marks = parseFloat(e.target.value) || 1; setNewTest({ ...newTest, questions: qs }); }} />
                    </div>
                    {qtype === 'scenario' ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-slate-700 font-medium text-sm">Case Scenario Description</Label>
                          <textarea rows={4} placeholder="e.g. A 40 year old male patient..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" value={q.scenarioText || ''} onChange={e => { const qs = [...newTest.questions]; qs[index].scenarioText = e.target.value; setNewTest({ ...newTest, questions: qs }); }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Scenario Specimen Images</Label>
                          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-teal-300 rounded-xl bg-white hover:bg-teal-50 cursor-pointer transition-colors">
                            <span className="text-sm text-teal-600 font-medium">Click to attach images</span>
                            <span className="text-xs text-teal-400 mt-0.5">Clinical photos, microscopy, culture media, etc.</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (!files.length) return; const previews = files.map(f => URL.createObjectURL(f)); const qs = [...newTest.questions]; qs[index].imageFiles = [...(qs[index].imageFiles || []), ...files]; qs[index].imagePreviews = [...(qs[index].imagePreviews || []), ...previews]; setNewTest({ ...newTest, questions: qs }); e.target.value = ''; }} />
                          </label>
                          {q.imagePreviews && q.imagePreviews.length > 0 && (<div className="grid grid-cols-4 gap-2">{q.imagePreviews.map((src: string, imgIdx: number) => (<div key={imgIdx} className="relative group rounded-lg overflow-hidden border border-teal-200 aspect-square"><img src={src} alt={`si-${imgIdx}`} className="w-full h-full object-cover" /><button type="button" className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { const qs = [...newTest.questions]; qs[index].imageFiles = qs[index].imageFiles.filter((_: any, i: number) => i !== imgIdx); qs[index].imagePreviews = qs[index].imagePreviews.filter((_: any, i: number) => i !== imgIdx); setNewTest({ ...newTest, questions: qs }); }}>&times;</button></div>))}</div>)}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-slate-700 font-semibold text-sm">Sub-Questions ({(q.subQuestions || []).length})</Label>
                            <Button variant="outline" size="sm" className="text-teal-700 border-teal-300 hover:bg-teal-50 h-7 text-xs" onClick={() => { const qs = [...newTest.questions]; qs[index].subQuestions = [...(qs[index].subQuestions || []), { text: '', correctAnswer: '', hintText: '' }]; setNewTest({ ...newTest, questions: qs }); }}>
                              <Plus className="w-3 h-3 mr-1" /> Add Sub-question
                            </Button>
                          </div>
                          {(q.subQuestions || []).map((sq: any, sqIdx: number) => (
                            <div key={sqIdx} className="bg-white border border-teal-100 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between"><span className="text-xs font-bold text-teal-600">{sqIdx + 1}.</span><button type="button" className="text-rose-400 hover:text-rose-600 text-xs" onClick={() => { const qs = [...newTest.questions]; qs[index].subQuestions = qs[index].subQuestions.filter((_: any, si: number) => si !== sqIdx); setNewTest({ ...newTest, questions: qs }); }}>Remove</button></div>
                              <Input placeholder={`Sub-question ${sqIdx + 1} text`} value={sq.text} onChange={e => { const qs = [...newTest.questions]; qs[index].subQuestions[sqIdx].text = e.target.value; setNewTest({ ...newTest, questions: qs }); }} />
                              <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Expected Answer / Key Points" value={sq.correctAnswer} onChange={e => { const qs = [...newTest.questions]; qs[index].subQuestions[sqIdx].correctAnswer = e.target.value; setNewTest({ ...newTest, questions: qs }); }} />
                                <Input placeholder="Hint (optional)" value={sq.hintText} onChange={e => { const qs = [...newTest.questions]; qs[index].subQuestions[sqIdx].hintText = e.target.value; setNewTest({ ...newTest, questions: qs }); }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <Input placeholder="Question Text" value={q.text} onChange={e => { const qs = [...newTest.questions]; qs[index].text = e.target.value; setNewTest({ ...newTest, questions: qs }); }} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input placeholder="Correct Answer" value={q.correctAnswer} onChange={e => { const qs = [...newTest.questions]; qs[index].correctAnswer = e.target.value; setNewTest({ ...newTest, questions: qs }); }} />
                          <Input placeholder="Hint (optional)" value={q.hintText} onChange={e => { const qs = [...newTest.questions]; qs[index].hintText = e.target.value; setNewTest({ ...newTest, questions: qs }); }} />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Specimen Images</Label>
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                            <span className="text-sm text-slate-500 font-medium">Click to select images</span>
                            <span className="text-xs text-slate-400 mt-1">Multiple files allowed</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (!files.length) return; const previews = files.map(f => URL.createObjectURL(f)); const qs = [...newTest.questions]; qs[index].imageFiles = [...(qs[index].imageFiles || []), ...files]; qs[index].imagePreviews = [...(qs[index].imagePreviews || []), ...previews]; setNewTest({ ...newTest, questions: qs }); e.target.value = ''; }} />
                          </label>
                          {q.imagePreviews && q.imagePreviews.length > 0 && (<div className="grid grid-cols-4 gap-2">{q.imagePreviews.map((src: string, imgIdx: number) => (<div key={imgIdx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square"><img src={src} alt={`img-${imgIdx}`} className="w-full h-full object-cover" /><button type="button" className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { const qs = [...newTest.questions]; qs[index].imageFiles = qs[index].imageFiles.filter((_: any, i: number) => i !== imgIdx); qs[index].imagePreviews = qs[index].imagePreviews.filter((_: any, i: number) => i !== imgIdx); setNewTest({ ...newTest, questions: qs }); }}>&times;</button></div>))}</div>)}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration" className="text-slate-700 font-medium">Duration (minutes)</Label>
                  <Input id="edit-duration" type="number" min="1" value={testDuration} onChange={e => setTestDuration(e.target.value)} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-access-code" className="text-slate-700 font-medium">Access Code (required)</Label>
                  <Input id="edit-access-code" type="text" placeholder="e.g. MICRO2025" value={testAccessCode} onChange={e => setTestAccessCode(e.target.value.toUpperCase())} className="rounded-lg font-mono tracking-widest uppercase" />
                  <p className="text-xs text-slate-400">Share this code with your students before the exam.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingTestId(null); setNewTest({ title: '', subject: '', duration: 60, accessCode: '', questions: [] }); }}>Cancel</Button>
              <Button onClick={handleUpdateTest} className="bg-teal-600 hover:bg-teal-700 text-white">Update Assessment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tests.map((test: any) => (
                <Card key={test.id} className="border border-slate-100 shadow-sm rounded-xl bg-white">
                  <CardHeader className="flex flex-row justify-between items-start pb-4">
                    <div className="flex gap-3">
                      <div className="bg-teal-50 text-teal-600 p-2 rounded-full w-10 h-10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">{test.subject}</p>
                        <CardTitle className="text-lg font-bold text-slate-900 mt-1">{test.title}</CardTitle>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-amber-600 hover:bg-amber-50" onClick={() => {
                        const mappedQuestions = (test.questions || []).map((q: any) => {
                          let savedUrls: string[] = []
                          try { savedUrls = JSON.parse(q.imageUrl || '[]') } catch { if (q.imageUrl) savedUrls = [q.imageUrl] }
                          const at = q.answerType || 'typed'
                          if (at === 'scenario') {
                            let subQs: any[] = []
                            try { subQs = JSON.parse(q.correctAnswer || '[]') } catch { subQs = [] }
                            return { type: 'scenario', answerType: 'scenario', scenarioText: q.text || '', imageUrl: q.imageUrl || '', imageFiles: [], imagePreviews: savedUrls, subQuestions: subQs.length ? subQs : [{ text: '', correctAnswer: '', hintText: '' }] }
                          }
                          if (at === 'options') {
                            let opts: any[] = [{label:'A',text:''},{label:'B',text:''},{label:'C',text:''},{label:'D',text:''}]
                            try { opts = JSON.parse(q.options || '[]') } catch {}
                            return { type: 'options', answerType: 'options', text: q.text || '', correctAnswer: q.correctAnswer || '', hintText: q.hintText || '', imageUrl: q.imageUrl || '', imageFiles: [], imagePreviews: savedUrls, options: opts }
                          }
                          return { type: 'typed', answerType: 'typed', text: q.text || '', correctAnswer: q.correctAnswer || '', hintText: q.hintText || '', imageUrl: q.imageUrl || '', imageFiles: [], imagePreviews: savedUrls }
                        })
                        setEditingTestId(test.id)
                        setNewTest({ title: test.title, subject: test.subject, duration: test.duration, accessCode: test.accessCode || '', questions: mappedQuestions })
                        setTestDuration(String(test.duration))
                        setTestAccessCode(test.accessCode || '')
                        setIsEditOpen(true)
                      }}>
                        <Pen className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50" title="View Student Scores" onClick={() => fetchScores(test.id, test.title)}>
                        <BarChart2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteTest(test.id, test.title)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Access Code Display */}
                    {test.accessCode && (
                      <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Code:</span>
                        <span className="font-mono font-bold text-amber-800 tracking-widest text-sm">{test.accessCode}</span>
                        <button
                          className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-semibold"
                          onClick={() => { navigator.clipboard.writeText(test.accessCode); toast.success('Code copied!') }}
                        >Copy</button>
                      </div>
                    )}
                    {!test.accessCode && (
                      <div className="mb-4 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-400">No access code set — anyone can start this test.</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-slate-600">{test.attempts?.length || 0} Attempts</span>
                         <span className="text-sm text-slate-400">| {test.duration} min</span>
                      </div>
                      <Button 
                        variant="outline"
                        className={`rounded-lg h-9 text-sm font-medium ${test.enabled ? 'border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'}`}
                        onClick={() => test.enabled ? toggleTestStatus(test.id, test.enabled) : handleEnableClick(test.id)}
                      >
                        {test.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enable Dialog — set duration + access code */}
            <Dialog open={durationDialogOpen} onOpenChange={setDurationDialogOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">Enable Test</DialogTitle>
                  <DialogDescription>
                    Set the duration and an access code students must enter to start this test.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-slate-700 font-medium">Duration (minutes)</Label>
                    <Input 
                      id="duration" 
                      type="number" 
                      min="1" 
                      value={testDuration} 
                      onChange={(e) => setTestDuration(e.target.value)}
                      className="rounded-lg" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-code-set" className="text-slate-700 font-medium">Access Code <span className="text-slate-400 font-normal">(required)</span></Label>
                    <Input 
                      id="access-code-set"
                      type="text"
                      placeholder="e.g. MICRO2025"
                      value={testAccessCode}
                      onChange={e => setTestAccessCode(e.target.value.toUpperCase())}
                      className="rounded-lg font-mono tracking-widest uppercase"
                    />
                    <p className="text-xs text-slate-400">Share this code with your students before the exam.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDurationDialogOpen(false)} className="rounded-lg">Cancel</Button>
                  <Button 
                    onClick={() => {
                      if (!testAccessCode.trim()) { toast.error('Please set an access code.'); return }
                      if (selectedTestId) {
                        toggleTestStatus(selectedTestId, false, parseInt(testDuration))
                        // Also save the access code
                        fetch(`http://localhost:5000/api/faculty/tests/${selectedTestId}/status`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'x-user-role': 'FACULTY', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ enabled: true, duration: parseInt(testDuration), accessCode: testAccessCode })
                        }).then(() => fetchData())
                      }
                    }} 
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                  >
                    Enable Test
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* ===== Student Scores Modal ===== */}
      <Dialog open={scoresModal.open} onOpenChange={open => setScoresModal(s => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-lg"><BarChart2 className="w-5 h-5 text-indigo-600" /></div>
              <div>
                <DialogTitle className="text-xl">Student Scores</DialogTitle>
                <DialogDescription>{scoresModal.testTitle} · Total Marks: <strong>{scoresModal.totalMarks}</strong></DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {scoresModal.attempts.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No submissions yet for this assessment.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {/* Header */}
              <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="col-span-2">Student</span>
                <span className="text-center">Marks</span>
                <span className="text-center">Percentage</span>
                <span className="text-center">Grade</span>
              </div>
              {scoresModal.attempts.map((attempt: any, i: number) => {
                const scored = attempt.scoreFloat ?? attempt.score ?? 0
                const total = attempt.totalMarks ?? scoresModal.totalMarks ?? 0
                const pct = total > 0 ? (scored / total) * 100 : 0
                const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'
                const gradeColor = pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                return (
                  <div key={attempt.id} className={`grid grid-cols-5 gap-2 px-3 py-3 rounded-xl border items-center ${i % 2 === 0 ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-transparent'}`}>
                    <div className="col-span-2">
                      <p className="font-semibold text-slate-800 text-sm">{attempt.student?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{attempt.student?.email}</p>
                      {attempt.submittedAt && <p className="text-xs text-slate-300 mt-0.5">{new Date(attempt.submittedAt).toLocaleString()}</p>}
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-800">{scored}</p>
                      <p className="text-xs text-slate-400">/ {total}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <p className="font-bold text-slate-700">{pct.toFixed(1)}%</p>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${gradeColor}`}>{grade}</span>
                    </div>
                  </div>
                )
              })}
              {/* Summary stats */}
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                {(() => {
                  const scores = scoresModal.attempts.map((a: any) => {
                    const s = a.scoreFloat ?? a.score ?? 0
                    const t = a.totalMarks ?? scoresModal.totalMarks ?? 1
                    return t > 0 ? (s / t) * 100 : 0
                  })
                  const avg = scores.reduce((a: number, b: number) => a + b, 0) / (scores.length || 1)
                  const max = Math.max(...scores)
                  const min = Math.min(...scores)
                  return <>
                    <div className="text-center bg-indigo-50 rounded-xl p-3"><p className="text-2xl font-black text-indigo-700">{avg.toFixed(1)}%</p><p className="text-xs text-slate-500 mt-1">Class Average</p></div>
                    <div className="text-center bg-emerald-50 rounded-xl p-3"><p className="text-2xl font-black text-emerald-700">{max.toFixed(1)}%</p><p className="text-xs text-slate-500 mt-1">Highest Score</p></div>
                    <div className="text-center bg-rose-50 rounded-xl p-3"><p className="text-2xl font-black text-rose-700">{min.toFixed(1)}%</p><p className="text-xs text-slate-500 mt-1">Lowest Score</p></div>
                  </>
                })()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoresModal(s => ({ ...s, open: false }))}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

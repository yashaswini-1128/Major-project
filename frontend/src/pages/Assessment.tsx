import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, Mic, MapPin, AlertCircle, CheckCircle2, ChevronRight, Lightbulb, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { io, Socket } from 'socket.io-client'
import { Progress } from '@/components/ui/progress'
import { ProctoringBot } from '@/components/ProctoringBot'
import { isWithinAllowedArea } from '@/lib/locationConfig'
export default function Assessment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  // Access code is passed via URL: /student/assessment/:id?code=XXXX
  const [searchParams] = useSearchParams()
  const accessCode = searchParams.get('code') || ''

  const [test, setTest] = useState<any>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const currentQuestionIndexRef = useRef(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  
  const [answer, setAnswer] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showHint, setShowHint] = useState(false)
  const [isWrong, setIsWrong] = useState(false)
  const [isCorrectState, setIsCorrectState] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false)
  const answersRef = useRef<Record<string, string>>({})

  // AI Hint state
  const [showAiHint, setShowAiHint] = useState(false)
  const [aiExplanation, setAiExplanation] = useState('')
  const [aiHintText, setAiHintText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Multi-image gallery state
  const [imageIndex, setImageIndex] = useState(0)
  
  const [socket, setSocket] = useState<Socket | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [camStatus, setCamStatus] = useState<'OK'|'WARNING'|'ERROR'>('OK')
  const [micStatus, setMicStatus] = useState<'OK'|'WARNING'|'ERROR'>('OK')
  const [locStatus, setLocStatus] = useState<'OK'|'WARNING'|'ERROR'>('OK')

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') {
      navigate('/')
      return
    }

    const startAttempt = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/student/tests/${id}/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'STUDENT', 'x-user-id': user.id, 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ accessCode })
        })
        const data = await res.json()
        if (res.ok) {
          setTest(data.test)
          setAttemptId(data.attempt.id)
          
          // Calculate time remaining based on duration and start time
          const durationSec = (data.test.duration || 60) * 60
          const elapsedSec = Math.floor((Date.now() - new Date(data.attempt.startedAt).getTime()) / 1000)
          setTimeLeft(Math.max(0, durationSec - elapsedSec))
        } else {
          toast.error(data.error)
          navigate('/student/dashboard')
        }
      } catch (err) {
        console.error(err)
      }
    }
    startAttempt()

    const newSocket = io('http://localhost:5000')
    setSocket(newSocket)

    newSocket.on('terminate_attempt', (data) => {
      toast.error('Your attempt has been terminated by the proctoring system: ' + data.reason)
      navigate('/student/dashboard')
    })

    return () => newSocket.disconnect()
  }, [id, user, navigate, token])

  // Update answersRef when answers change
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Timer Countdown Logic
  useEffect(() => {
    if (timeLeft === null || !test || isTimeUp) return
    if (timeLeft <= 0) {
      setIsTimeUp(true)
      toast.error("Time is up! Submitting test automatically.", { duration: 5000 })
      return
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, test, isTimeUp])

  // Auto Submit on Time Up
  useEffect(() => {
    if (isTimeUp) {
      submitTest()
    }
  }, [isTimeUp])

  // Enforce Full Screen
  useEffect(() => {
    const tryFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen()
      } catch (err) {
        setNeedsGesture(true)
      }
    }
    // Give a short delay to allow UI to mount before attempting automatic fullscreen
    setTimeout(tryFullscreen, 300)
  }, [])

  // Full Screen Exit Tracking
  useEffect(() => {
    if (!socket || !attemptId) return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenWarnings(prev => {
          const next = prev + 1
          if (next >= 3) {
            // 3 strikes, terminate the test
            toast.error("Test Terminated: Exited full screen 3 times.", { style: { backgroundColor: '#fee2e2', color: '#b91c1c' } })
            socket.emit('proctoring_ping', { attemptId, type: 'BROWSER', event: 'EXIT_FULLSCREEN' })
          } else {
            // Warn user
            toast.error(`Warning: Do not exit full screen mode! (${next}/3 warnings)`, {
              style: { backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#f87171' }
            })
          }
          return next
        })
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [socket, attemptId])

  // Tab Switch Tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setShowTabSwitchWarning(true)
        if (socket && attemptId) {
          socket.emit('proctoring_ping', { attemptId, type: 'BROWSER', event: 'TAB_SWITCH' })
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [socket, attemptId])

  useEffect(() => {
    let stream: MediaStream | null = null
    const enableWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCamStatus('OK')
        setMicStatus('OK')
      } catch (err) {
        setCamStatus('ERROR')
        setMicStatus('ERROR')
        toast.error("Camera/Mic access lost! Attempt will be flagged.")
        if (socket && attemptId) {
          socket.emit('proctoring_ping', { attemptId, type: 'WEBCAM', event: 'CAMERA_CLOSED' })
        }
      }
    }
    enableWebcam()

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (isWithinAllowedArea(latitude, longitude)) {
            setLocStatus('OK')
          } else {
            setLocStatus('ERROR')
            toast.error('Location check failed: you are outside the permitted exam area.')
            if (socket && attemptId) socket.emit('proctoring_ping', { attemptId, type: 'LOCATION', event: 'LEFT_AREA' })
          }
        },
        () => {
          setLocStatus('ERROR')
          if (socket && attemptId) socket.emit('proctoring_ping', { attemptId, type: 'LOCATION', event: 'LEFT_AREA' })
        }
      )
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [socket, attemptId])

  useEffect(() => {
    if (!socket || !attemptId) return
    const interval = setInterval(() => {
      if (camStatus === 'OK') socket.emit('proctoring_ping', { attemptId, type: 'WEBCAM', event: 'OK' })
      if (micStatus === 'OK') socket.emit('proctoring_ping', { attemptId, type: 'MIC', event: 'OK' })
    }, 10000)
    return () => clearInterval(interval)
  }, [socket, attemptId, camStatus, micStatus])

  const handleNext = () => {
    if (!test) return
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(curr => curr + 1)
      setAnswer('')
      setShowHint(false)
      setIsWrong(false)
      setIsCorrectState(false)
      setWrongAttempts(0)
      setShowAiHint(false)
      setAiExplanation('')
      setAiHintText('')
      setImageIndex(0)
    } else {
      submitTest()
    }
  }

  const fetchAiHint = async (questionId: string, wrongAnswer: string) => {
    setAiLoading(true)
    setShowAiHint(true)
    try {
      const res = await fetch('http://localhost:5000/api/student/ai-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'STUDENT', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ questionId, studentAnswer: wrongAnswer })
      })
      const data = await res.json()
      if (res.ok) {
        setAiExplanation(data.explanation)
        setAiHintText(data.hint || '')
      } else {
        setAiExplanation('Could not generate explanation. Please review the hint and try again.')
      }
    } catch {
      setAiExplanation('Could not connect to AI service. Please review the hint and try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!test) return
    const currentQ = test.questions[currentQuestionIndex]
    
    if (isCorrectState) {
      // User is already correct, just go next
      handleNext()
      return
    }

    const isCorrect = answer.trim().toLowerCase() === currentQ.correctAnswer.toLowerCase()
    
    if (isCorrect) {
      setAnswers(prev => ({ ...prev, [currentQ.id]: answer }))
      setIsCorrectState(true)
      setShowHint(false)
      toast.success('Correct!')
      setTimeout(() => { handleNext() }, 1500)
    } else {
      const newAttempts = wrongAttempts + 1
      setWrongAttempts(newAttempts)
      setIsWrong(true)
      setShowHint(true)
      const wrongAns = answer
      setAnswer('')
      fetchAiHint(currentQ.id, wrongAns)
    }
  }

  const submitTest = async () => {
    if (!attemptId) return
    try {
      const res = await fetch(`http://localhost:5000/api/student/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'STUDENT', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answers: answersRef.current })
      })
      if (res.ok) {
        toast.success("Assessment submitted successfully!")
        navigate(`/student/result/${attemptId}`)
      }
    } catch (err) {
      toast.error('Failed to submit test')
    }
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h} hr ${m} min ${s} sec`
    return `${m} min ${s} sec`
  }

  if (!test) return <div className="flex h-screen items-center justify-center font-sans text-slate-500">Loading assessment environment...</div>

  if (needsGesture && !document.fullscreenElement) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans flex-col space-y-4 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center space-y-6">
          <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Assessment Ready</h2>
          <p className="text-slate-600 text-lg">
            This assessment requires full screen mode. Please click the button below to enter full screen and start the test.
          </p>
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-14 text-lg font-medium shadow-lg shadow-teal-600/20"
            onClick={async () => {
              try {
                await document.documentElement.requestFullscreen()
                setNeedsGesture(false)
              } catch (e) {
                toast.error("Failed to enter full screen")
              }
            }}
          >
            Enter Full Screen & Start
          </Button>
        </div>
      </div>
    )
  }

  const currentQ = test.questions[currentQuestionIndex]
  const progressPercent = ((currentQuestionIndex + 1) / test.questions.length) * 100

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-24 relative overflow-hidden">
      
      {/* Top Header & Progress */}
      <div className="max-w-6xl mx-auto mb-8">
        
        {/* Top left Header Pill (HackerRank style, light themed) */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
            <div className={`w-2 h-2 rounded-full ${timeLeft !== null && timeLeft <= 300 ? 'bg-rose-500 animate-bounce' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className={`text-xs font-bold ${timeLeft !== null && timeLeft <= 300 ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="scale-50 origin-left -ml-2 -mt-1">
            <ProctoringBot />
          </div>
        </div>

        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">{test.subject}</p>
            <h1 className="text-2xl font-bold text-slate-900">{test.title}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Candidate: <span className="text-slate-700 font-bold">{user?.name}</span> &nbsp;|&nbsp; Assigned by: <span className="text-slate-700 font-bold">{test.faculty?.name || 'Faculty'}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-700">Question {currentQuestionIndex + 1} of {test.questions.length}</p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2 bg-slate-200" />
      </div>

      {/* Main Two-Panel Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Specimen Image(s) — gallery if multiple */}
        {(() => {
          let images: string[] = []
          try {
            const parsed = JSON.parse(currentQ.imageUrl)
            images = Array.isArray(parsed) ? parsed : [currentQ.imageUrl]
          } catch {
            images = currentQ.imageUrl ? [currentQ.imageUrl] : []
          }
          const hasMultiple = images.length > 1
          return (
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden bg-white h-[500px] border border-slate-100 relative">
              {/* Image */}
              <div className="w-full h-full flex items-center justify-center p-4">
                {images[imageIndex] ? (
                  <img
                    src={images[imageIndex]}
                    alt={`Specimen ${imageIndex + 1}`}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-slate-400 text-sm">No image provided</div>
                )}
              </div>

              {/* Navigation arrows */}
              {hasMultiple && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center shadow text-slate-700 disabled:opacity-30"
                    onClick={() => setImageIndex(i => Math.max(0, i - 1))}
                    disabled={imageIndex === 0}
                  >‹</button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center shadow text-slate-700 disabled:opacity-30"
                    onClick={() => setImageIndex(i => Math.min(images.length - 1, i + 1))}
                    disabled={imageIndex === images.length - 1}
                  >›</button>
                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === imageIndex ? 'bg-teal-600 scale-125' : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Counter badge */}
                  <div className="absolute top-3 right-3 bg-slate-900/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {imageIndex + 1}/{images.length}
                  </div>
                </>
              )}
            </Card>
          )
        })()}

        {/* Right: Question & Input */}
        <div className="flex flex-col space-y-6 h-full">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl bg-white flex-1">
            <CardHeader className="border-b border-slate-50 pb-6">
              <CardTitle className="text-xl text-slate-800 leading-relaxed font-medium">
                {currentQ.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitAnswer} className="space-y-6">
                
                {isCorrectState ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center space-y-3 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <p className="text-lg font-bold text-emerald-800">Correct Answer!</p>
                  </div>
                ) : (
                  <>
                    <Input 
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      placeholder="Enter the appropriate test identification..."
                      className="text-lg py-7 px-4 rounded-xl border-slate-200 focus-visible:ring-teal-600 shadow-sm"
                      required
                    />
                    
                    {showHint && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="text-sm font-bold text-amber-900">Hint</p>
                          <p className="text-sm text-amber-800 mt-1">{currentQ.hintText}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  {!isCorrectState && (
                    <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-14 text-lg font-medium shadow-lg shadow-teal-600/20">
                      {isWrong ? `Try Again (${3 - wrongAttempts} left)` : 'Submit Answer'}
                    </Button>
                  )}
                  {/* Skip only unlocks after 3 wrong attempts */}
                  {isWrong && !isCorrectState && wrongAttempts >= 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleNext}
                      className="flex-1 border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl h-14 text-sm font-medium"
                    >
                      Skip Question
                    </Button>
                  )}
                  {isCorrectState && (
                    <Button type="button" onClick={handleNext} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-14 text-lg font-medium shadow-lg shadow-teal-600/20">
                      Continue <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Persistent Floating Proctoring Widget */}
      <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex flex-col gap-3 w-64">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center border-b border-slate-50 pb-2">Active Proctoring</p>
        
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Camera</span>
          </div>
          <StatusPill status={camStatus} />
        </div>
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Microphone</span>
          </div>
          <StatusPill status={micStatus} />
        </div>
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Location</span>
          </div>
          <StatusPill status={locStatus} />
        </div>

        <div className="mt-2 w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-black relative">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 ring-2 ring-inset ring-emerald-500/50 rounded-xl pointer-events-none"></div>
        </div>
      </div>
      
      {/* Tab Switch Warning Modal */}
      {showTabSwitchWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-[450px] shadow-2xl relative overflow-hidden flex flex-col p-8">
            <div className="flex justify-start mb-2 -ml-6 -mt-6">
              <div className="scale-75 origin-top-left">
                <ProctoringBot />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Avoid switching tabs</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Switching tabs during the test can be considered as suspicious activity. Please refrain from doing so during rest of the test.
            </p>
            <Button 
              className="self-start bg-slate-900 text-white hover:bg-slate-800 rounded-lg px-6"
              onClick={() => setShowTabSwitchWarning(false)}
            >
              I understand
            </Button>
          </div>
        </div>
      )}
      {/* AI Hint Dialog */}
      <Dialog open={showAiHint} onOpenChange={(open) => { if (!open) setShowAiHint(false) }}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-6 pt-7 pb-6 text-white">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-white/70">AI Learning Assistant</span>
              </div>
              <DialogTitle className="text-xl font-bold text-white text-left">
                Let's understand this better 🔬
              </DialogTitle>
              <p className="text-white/70 text-sm mt-1">
                {wrongAttempts < 3
                  ? `Attempt ${wrongAttempts} of 3 — review below and try again.`
                  : `3 attempts used — you may now skip this question.`}
              </p>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 bg-white">
            {/* AI Explanation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">AI Explanation</p>
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                {aiLoading ? (
                  <div className="flex items-center gap-3 text-violet-500">
                    <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Generating explanation...</p>
                  </div>
                ) : (
                  <p className="text-sm text-violet-900 leading-relaxed">{aiExplanation}</p>
                )}
              </div>
            </div>

            {/* Faculty Hint */}
            {aiHintText && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Faculty Hint</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-amber-900 leading-relaxed">{aiHintText}</p>
                </div>
              </div>
            )}

            <Button
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium mt-2"
              onClick={() => setShowAiHint(false)}
            >
              Got it — Let me try again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}

function StatusPill({ status }: { status: 'OK' | 'WARNING' | 'ERROR' }) {
  if (status === 'OK') {
    return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
  }
  if (status === 'WARNING') {
    return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Warning</span>
  }
  return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Error</span>
}

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useAuthStore } from '@/store/useAuthStore'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()

  const [attempt, setAttempt] = useState<any>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/student/attempts/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setAttempt(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchResult()
  }, [id, token])

  if (!attempt) return <div className="flex h-screen items-center justify-center font-sans text-slate-500">Loading result...</div>

  // Generate question details since we need to show right/wrong.
  // The backend attempt endpoint would ideally return the questions and user's answers.
  // For the sake of UI rendering, we'll map through the answers object.
  const totalQuestions = attempt.test?.questions?.length || Object.keys(attempt.answers).length
  const score = attempt.score
  const percentage = Math.round((score / totalQuestions) * 100) || 0
  
  let gradeColor = 'text-emerald-600'
  let ringColor = 'border-emerald-500 bg-emerald-50'
  if (percentage < 70) {
    gradeColor = 'text-amber-600'
    ringColor = 'border-amber-500 bg-amber-50'
  }
  if (percentage < 50) {
    gradeColor = 'text-rose-600'
    ringColor = 'border-rose-500 bg-rose-50'
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-slate-50 font-sans">
      <Card className="w-full max-w-2xl border-none shadow-xl shadow-slate-200/50 rounded-xl bg-white overflow-hidden">
        <div className="h-2 w-full bg-teal-600"></div>
        <CardHeader className="text-center pb-2 pt-8">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Assessment Complete
          </CardTitle>
          {attempt.status === 'TERMINATED' && (
            <Badge variant="destructive" className="mx-auto mt-2 bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
              Terminated: {attempt.terminationReason}
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="pt-6 space-y-8">
          {/* Large Score Display */}
          <div className="flex flex-col items-center justify-center">
            <div className={`w-40 h-40 rounded-full border-8 flex flex-col items-center justify-center shadow-inner ${ringColor}`}>
              <span className={`text-4xl font-black ${gradeColor}`}>{score} <span className="text-2xl text-slate-400">/ {totalQuestions}</span></span>
              <span className={`text-sm font-bold mt-1 ${gradeColor}`}>{percentage}%</span>
            </div>
          </div>

          {/* Question Review List */}
          {attempt.test && attempt.test.questions && (
            <div className="space-y-3 mt-8">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Question Review</h3>
              {attempt.test.questions.map((q: any, idx: number) => {
                const userAnswer = attempt.answers[q.id] || 'Not answered'
                const isCorrect = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase()
                const isExpanded = expanded === q.id
                
                return (
                  <div key={q.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm transition-all">
                    <button 
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : q.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-700 text-left">Question {idx + 1}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-100 space-y-4">
                        <div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Your Answer</p>
                          <p className={`text-base font-medium ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>{userAnswer}</p>
                        </div>
                        {!isCorrect && (
                          <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Correct Answer</p>
                            <p className="text-base font-medium text-slate-800">{q.correctAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center pt-2 pb-8 px-8">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-xl text-lg font-medium shadow-lg shadow-teal-600/20"
            onClick={() => navigate('/student/dashboard')}
          >
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

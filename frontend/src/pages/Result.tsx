import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useAuthStore } from '@/store/useAuthStore'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Award, BarChart2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import API_BASE from '@/lib/api'

export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()

  const [attempt, setAttempt] = useState<any>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/student/attempts/${id}`, {
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

  if (!attempt) return (
    <div className="flex h-screen items-center justify-center font-sans text-slate-500">
      Loading result...
    </div>
  )

  // Weighted score (preferred) or fallback to count-based
  const scoreFloat = attempt.scoreFloat ?? attempt.score ?? 0
  const totalMarks = attempt.totalMarks ?? attempt.test?.questions?.length ?? 1
  const percentage = totalMarks > 0 ? Math.round((scoreFloat / totalMarks) * 100) : 0

  const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F'
  const gradeColor = percentage >= 80 ? 'text-emerald-600' : percentage >= 60 ? 'text-amber-600' : 'text-rose-600'
  const ringColor = percentage >= 80 ? 'border-emerald-500 bg-emerald-50' : percentage >= 60 ? 'border-amber-500 bg-amber-50' : 'border-rose-500 bg-rose-50'
  const barColor = percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'

  // Parse student answers JSON
  let savedAnswers: Record<string, string> = {}
  try { savedAnswers = JSON.parse(attempt.answers || '{}') } catch {}

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-slate-50 font-sans min-h-screen">
      <Card className="w-full max-w-2xl border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-teal-500 to-emerald-500" />
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Award className="w-6 h-6 text-teal-600" />
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Assessment Complete
            </CardTitle>
          </div>
          {attempt.test?.title && (
            <p className="text-sm text-slate-400 font-medium">{attempt.test.title}</p>
          )}
          {attempt.status === 'TERMINATED' && (
            <Badge variant="destructive" className="mx-auto mt-2 bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
              Terminated: {attempt.terminationReason}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          {/* Score Ring + Stats */}
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Animated score ring */}
            <div className={`w-40 h-40 rounded-full border-8 flex flex-col items-center justify-center shadow-inner ${ringColor}`}>
              <span className={`text-4xl font-black ${gradeColor}`}>{scoreFloat}</span>
              <span className="text-slate-400 text-sm font-semibold">/ {totalMarks} marks</span>
              <span className={`text-lg font-bold mt-1 ${gradeColor}`}>{percentage}%</span>
            </div>

            {/* Grade badge */}
            <div className={`text-3xl font-black px-6 py-2 rounded-xl border-2 ${
              percentage >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              percentage >= 60 ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              Grade: {grade}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-sm">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ${barColor}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
                <span>0</span>
                <span>{totalMarks} marks</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xl font-black text-slate-800">{scoreFloat}</p>
              <p className="text-xs text-slate-400 mt-1">Marks Scored</p>
            </div>
            <div className="text-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xl font-black text-slate-800">{totalMarks}</p>
              <p className="text-xs text-slate-400 mt-1">Total Marks</p>
            </div>
            <div className="text-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className={`text-xl font-black ${gradeColor}`}>{percentage}%</p>
              <p className="text-xs text-slate-400 mt-1">Percentage</p>
            </div>
          </div>

          {/* Question Review List */}
          {attempt.test && attempt.test.questions && (
            <div className="space-y-3 mt-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Question Review
              </h3>
              {attempt.test.questions.map((q: any, idx: number) => {
                const userAnswer = savedAnswers[q.id] || ''
                const isScenario = q.answerType === 'scenario'
                const isMCQ = q.answerType === 'options'
                const isCorrect = !isScenario && userAnswer.toLowerCase().trim() === (q.correctAnswer || '').toLowerCase().trim() && q.correctAnswer !== ''
                const isExpanded = expanded === q.id

                return (
                  <div key={q.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm transition-all">
                    <button
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : q.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isScenario ? (
                          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs font-bold flex items-center justify-center">📋</span>
                        ) : isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-700 text-left text-sm">
                          Q{idx + 1}
                          {isScenario && <span className="ml-2 text-xs text-teal-600 font-normal">Case Scenario</span>}
                          {isMCQ && <span className="ml-2 text-xs text-violet-600 font-normal">MCQ</span>}
                        </span>
                        {q.marks && q.marks > 1 && (
                          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">{q.marks} marks</span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 border-t border-slate-100 space-y-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Question</p>
                          <p className="text-sm font-medium text-slate-700">{q.text || q.scenarioText}</p>
                        </div>

                        {isScenario ? (
                          <div className="bg-teal-50 rounded-lg p-3 text-sm text-teal-700">
                            <p className="font-semibold mb-1">Scenario answers (manually graded):</p>
                            {(() => {
                              let subQs: any[] = []
                              let subAnswers: Record<number, string> = {}
                              try { subQs = JSON.parse(q.correctAnswer || '[]') } catch {}
                              try { subAnswers = JSON.parse(userAnswer || '{}') } catch {}
                              return subQs.map((sq: any, si: number) => (
                                <div key={si} className="mt-2">
                                  <p className="text-xs font-semibold">{si + 1}. {sq.text}</p>
                                  <p className="text-xs text-teal-600 mt-0.5">Your answer: {subAnswers[si] || <em className="opacity-50">Not answered</em>}</p>
                                </div>
                              ))
                            })()}
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Answer</p>
                              <p className={`text-sm font-medium ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {userAnswer || <em className="text-slate-400">Not answered</em>}
                              </p>
                            </div>
                            {!isCorrect && q.correctAnswer && (
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Correct Answer</p>
                                <p className="text-sm font-medium text-slate-800">{q.correctAnswer}</p>
                              </div>
                            )}
                          </>
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

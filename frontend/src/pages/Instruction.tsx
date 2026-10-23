import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Mic, MapPin, Image as ImageIcon, HelpCircle, FileCheck, AlertTriangle, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

export default function Instruction() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [accessCode, setAccessCode] = useState('')
  const [codeVerified, setCodeVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Quick code check — we do a dry-run attempt to validate the code before proceeding
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessCode.trim()) {
      toast.error('Please enter the access code.')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch(`http://localhost:5000/api/student/tests/${id}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'STUDENT' },
        body: JSON.stringify({ accessCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid code')
      setCodeVerified(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setVerifying(false)
    }
  }

  // Step 1 — Enter access code
  if (!codeVerified) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12 bg-slate-50 font-sans">
        <Card className="w-full max-w-md border-none shadow-xl shadow-slate-200/50 rounded-xl bg-white">
          <CardHeader className="border-b border-slate-100 pb-6 text-center">
            <div className="mx-auto bg-teal-50 w-14 h-14 flex items-center justify-center rounded-full mb-4">
              <KeyRound className="w-7 h-7 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Enter Access Code
            </CardTitle>
            <p className="text-slate-500 text-sm mt-2">
              Your faculty has provided an access code to start this assessment.
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="access-code" className="text-slate-700 font-medium">Access Code</Label>
                <Input
                  id="access-code"
                  type="text"
                  placeholder="Enter the code given by your faculty"
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  className="h-12 rounded-lg border-slate-200 focus-visible:ring-teal-600 text-center text-lg font-bold tracking-widest uppercase"
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                disabled={verifying}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
              >
                {verifying ? 'Verifying...' : 'Verify Code →'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <button
              className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
              onClick={() => navigate('/student/dashboard')}
            >
              ← Back to Dashboard
            </button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Step 2 — Show instructions
  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-slate-50 font-sans">
      <Card className="w-full max-w-2xl border-none shadow-xl shadow-slate-200/50 rounded-xl bg-white">
        <CardHeader className="border-b border-slate-100 pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 text-center">
            Assessment Instructions
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <RuleItem 
              icon={<Camera className="w-5 h-5 text-teal-600" />}
              title="Camera Required"
              desc="Your webcam must remain enabled during the assessment."
            />
            <RuleItem 
              icon={<Mic className="w-5 h-5 text-teal-600" />}
              title="Microphone Required"
              desc="Your microphone must remain enabled during the assessment."
            />
            <RuleItem 
              icon={<MapPin className="w-5 h-5 text-teal-600" />}
              title="Location Verification"
              desc="Your location will be checked during the assessment. Leaving the permitted area may terminate the assessment."
            />
            <RuleItem 
              icon={<ImageIcon className="w-5 h-5 text-teal-600" />}
              title="Image-Based Questions"
              desc="Each question contains a laboratory image. Enter the appropriate test identification."
            />
            <RuleItem 
              icon={<HelpCircle className="w-5 h-5 text-teal-600" />}
              title="Hints"
              desc="If your answer is incorrect, a hint will be displayed before you continue to the next question."
            />
            <RuleItem 
              icon={<FileCheck className="w-5 h-5 text-teal-600" />}
              title="Questions"
              desc="Once you submit an answer, you will proceed according to the assessment rules."
            />
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 flex gap-3 mt-6">
            <AlertTriangle className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-teal-900">Important:</p>
              <p className="text-sm text-teal-800 mt-1">
                Please make sure your camera, microphone and location permissions are available before starting. 
                Do not close or refresh the assessment window while the test is in progress.
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4 pt-4 pb-6 px-6">
          <Button 
            variant="outline" 
            className="w-full sm:w-1/3 border-slate-300 text-slate-700 h-11 rounded-lg font-medium"
            onClick={() => navigate('/student/dashboard')}
          >
            Cancel
          </Button>
          <Button 
            className="w-full sm:w-2/3 bg-teal-600 hover:bg-teal-700 text-white h-11 rounded-lg font-medium"
            onClick={() => navigate(`/security-check?testId=${id}&code=${encodeURIComponent(accessCode)}`)}
          >
            Continue to Verification →
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function RuleItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="bg-slate-100 p-2.5 rounded-lg shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

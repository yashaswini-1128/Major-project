import React, { useEffect, useState } from 'react'
import { isWithinAllowedArea, ALLOWED_LOCATION } from '@/lib/locationConfig'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Camera, Mic, MapPin, AlertCircle } from 'lucide-react'
import { ProctoringBot } from '@/components/ProctoringBot'

export default function SecurityCheck() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const testId = searchParams.get('testId')
  const code = searchParams.get('code') || ''

  const [camStatus, setCamStatus] = useState<'Checking...' | 'Granted' | 'Denied'>('Checking...')
  const [micStatus, setMicStatus] = useState<'Checking...' | 'Granted' | 'Denied'>('Checking...')
  const [locStatus, setLocStatus] = useState<'Checking...' | 'Granted' | 'Denied'>('Checking...')

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setCamStatus('Granted')
        setMicStatus('Granted')
        stream.getTracks().forEach(track => track.stop())
      } catch (err) {
        setCamStatus('Denied')
        setMicStatus('Denied')
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            if (isWithinAllowedArea(latitude, longitude)) {
              setLocStatus('Granted')
            } else {
              setLocStatus('Denied')
            }
          },
          () => setLocStatus('Denied')
        )
      } else {
        setLocStatus('Denied')
      }
    }
    requestPermissions()
  }, [])

  const allGranted = camStatus === 'Granted' && micStatus === 'Granted' && locStatus === 'Granted'

  const handleContinue = () => {
    if (allGranted && testId) {
      navigate(`/student/assessment/${testId}?code=${encodeURIComponent(code)}`)
    } else if (allGranted) {
      navigate('/student/dashboard')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-slate-50 font-sans">
      <Card className="w-full max-w-2xl border-none shadow-xl shadow-slate-200/50 rounded-xl bg-white relative">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 scale-75">
          <ProctoringBot />
        </div>
        <CardHeader className="border-b border-slate-100 pb-6 mt-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 text-center">
            Assessment Check
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          <CheckRow 
            icon={<Camera className="w-5 h-5 text-slate-600" />}
            title="Camera"
            desc="Your webcam must remain enabled during the assessment."
            status={camStatus}
          />
          <CheckRow 
            icon={<Mic className="w-5 h-5 text-slate-600" />}
            title="Microphone"
            desc="Your microphone must remain enabled during the assessment."
            status={micStatus}
          />
          <CheckRow 
            icon={<MapPin className="w-5 h-5 text-slate-600" />}
            title="Location"
            desc={`You must be physically present at the designated exam centre (within ${ALLOWED_LOCATION.radiusMeters}m of CDSIMER, Kanakapura) to proceed.`}
            status={locStatus}
          />

          <div className="mt-8 flex items-start gap-3 text-slate-500 text-sm bg-slate-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
            <p>
              <span className="font-bold text-slate-700">Important:</span> Please do not close this browser tab or disable your camera, microphone, or location during the assessment.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-4 pt-4 pb-6 px-6">
          <Button 
            variant="outline" 
            className="w-1/3 border-slate-300 text-slate-700 h-11 rounded-lg font-medium"
            onClick={() => navigate(-1)}
          >
            &larr; Back
          </Button>
          <Button 
            className="w-2/3 bg-teal-600 hover:bg-teal-700 text-white h-11 rounded-lg font-medium"
            disabled={!allGranted}
            onClick={handleContinue}
          >
            Complete Verification
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function CheckRow({ icon, title, desc, status }: { icon: React.ReactNode, title: string, desc: string, status: string }) {
  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200'
  if (status === 'Checking...') badgeColor = 'bg-amber-100 text-amber-700 border-amber-200'
  if (status === 'Granted') badgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (status === 'Denied') badgeColor = 'bg-rose-100 text-rose-700 border-rose-200'

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex gap-4 items-center">
        <div className="bg-slate-100 p-2.5 rounded-lg shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">{desc}</p>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
        {status}
      </div>
    </div>
  )
}

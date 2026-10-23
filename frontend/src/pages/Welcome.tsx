import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FlaskConical } from 'lucide-react'

export default function Welcome() {
  return (
    <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-12 max-w-6xl mx-auto w-full">
      {/* Left Column */}
      <div className="flex-1 space-y-8">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-teal-50 text-teal-700">
          🔬 Interactive Virtual Laboratory
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
          Virtual Microbiology <br /> Lab Assessment
        </h1>
        
        <p className="text-lg text-slate-600 max-w-[600px] leading-relaxed">
          An interactive platform for conducting microbiology assessments through virtual laboratory test identification.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link to="/login?role=student">
            <Button size="lg" className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-8 h-14 text-lg">
              Student Login
            </Button>
          </Link>
          <Link to="/login?role=faculty">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 hover:bg-slate-50 text-slate-900 rounded-lg px-8 h-14 text-lg">
              Faculty Login
            </Button>
          </Link>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 w-full max-w-md hidden md:flex items-center justify-center">
        <div className="w-full bg-slate-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-inner border border-slate-200">
          <div className="bg-white p-6 rounded-full shadow-sm mb-6">
            <FlaskConical className="w-16 h-16 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Virtual Laboratory</h2>
          <p className="text-slate-500 font-medium">Learn · Identify · Assess</p>
        </div>
      </div>
    </div>
  )
}

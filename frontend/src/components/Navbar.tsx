import { Link } from 'react-router-dom'
import { Microscope } from 'lucide-react'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-teal-600/10 p-2 rounded-lg">
            <Microscope className="h-6 w-6 text-teal-600" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Virtual Microbiology Lab</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Home</Link>
          <Link to="/student/dashboard" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Tests</Link>
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">About</Link>
        </nav>
      </div>
    </header>
  )
}


export function ProctoringBot({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full scale-150"></div>
      
      {/* SVG Face */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Eyebrows */}
        <path
          d="M 25 35 Q 35 25 45 35"
          stroke="#1e293b"
          strokeWidth="6"
          strokeLinecap="round"
          className="dark:stroke-slate-200"
        />
        <path
          d="M 55 35 Q 65 25 75 35"
          stroke="#1e293b"
          strokeWidth="6"
          strokeLinecap="round"
          className="dark:stroke-slate-200"
        />

        {/* Glasses bridge */}
        <path
          d="M 45 50 L 55 50"
          stroke="#22c55e"
          strokeWidth="6"
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
        />

        {/* Left Eye & Lens */}
        <circle cx="32" cy="50" r="14" fill="white" />
        <circle cx="32" cy="50" r="6" fill="#0f172a" />
        <circle
          cx="32"
          cy="50"
          r="16"
          stroke="#22c55e"
          strokeWidth="6"
          className="drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
        />

        {/* Right Eye & Lens */}
        <circle cx="68" cy="50" r="14" fill="white" />
        <circle cx="68" cy="50" r="6" fill="#0f172a" />
        <circle
          cx="68"
          cy="50"
          r="16"
          stroke="#22c55e"
          strokeWidth="6"
          className="drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
        />

        {/* Smile */}
        <path
          d="M 35 75 Q 50 85 65 75"
          stroke="#1e293b"
          strokeWidth="6"
          strokeLinecap="round"
          className="dark:stroke-slate-200"
        />
      </svg>
    </div>
  );
}

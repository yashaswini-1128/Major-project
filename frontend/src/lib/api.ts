// Central API configuration
// Uses VITE_API_URL in production (set on Vercel), falls back to localhost in dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default API_BASE

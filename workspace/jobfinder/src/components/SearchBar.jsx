import { motion } from 'framer-motion'
import { Search, MapPin, Briefcase, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { COUNTRIES, CONTRACT_OPTIONS } from '../config'

export default function SearchBar({ onSearch, loading, initialWhat = '', initialWhere = '', initialCountry = 'gb' }) {
  const [what, setWhat] = useState(initialWhat)
  const [where, setWhere] = useState(initialWhere)
  const [country, setCountry] = useState(initialCountry)
  const [contract, setContract] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)
  const countryRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setWhat(initialWhat)
    setWhere(initialWhere)
    setCountry(initialCountry)
  }, [initialWhat, initialWhere, initialCountry])

  const selected = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ what, where, country, contract })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.35 }}
      className="mx-auto mt-8 max-w-3xl"
    >
      <form
        onSubmit={handleSubmit}
        className="glass-strong animated-border rounded-3xl p-2.5 shadow-2xl shadow-purple-950/30"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 bg-white/5">
            <Briefcase size={20} className="shrink-0 text-purple-400" />
            <input
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder="Job title, skills or keyword"
              className="w-full bg-transparent text-sm md:text-base text-white placeholder:text-slate-500 outline-none"
            />
          </div>

          <div className="hidden h-8 w-px bg-white/10 md:block" />

          <div className="flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 bg-white/5">
            <MapPin size={20} className="shrink-0 text-cyan-400" />
            <input
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="City or location"
              className="w-full bg-transparent text-sm md:text-base text-white placeholder:text-slate-500 outline-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-3.5 font-semibold text-white btn-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Search size={19} />
            )}
            <span className="hidden sm:inline">Search Jobs</span>
          </motion.button>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 px-2 pb-1">
          <div ref={countryRef} className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:border-purple-400/40 transition-colors cursor-pointer"
            >
              <span>{selected.flag}</span>
              <span className="font-medium">{selected.code.toUpperCase()}</span>
              <ChevronDown size={14} className={`transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
            </button>

            {countryOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 z-20 mt-2 max-h-64 w-52 overflow-y-auto glass-strong rounded-2xl p-1.5"
              >
                {COUNTRIES.map((c) => (
                  <button
                    type="button"
                    key={c.code}
                    onClick={() => {
                      setCountry(c.code)
                      setCountryOpen(false)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer ${
                      country === c.code
                        ? 'bg-gradient-to-r from-indigo-600/40 to-purple-600/40 text-white'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors cursor-pointer ${
              showFilters
                ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-purple-400/40'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {contract && <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />}
          </button>

          {contract && (
            <button
              type="button"
              onClick={() => setContract('')}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 cursor-pointer"
            >
              {CONTRACT_OPTIONS.find((o) => o.value === contract)?.label}
              <span className="ml-1 text-emerald-400/70">×</span>
            </button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-wrap gap-2 rounded-2xl bg-white/5 p-3">
              <span className="w-full text-xs uppercase tracking-wider text-slate-500">Contract type</span>
              {CONTRACT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setContract((c) => (c === opt.value ? '' : opt.value))}
                  className={`rounded-xl px-3.5 py-1.5 text-sm transition-all cursor-pointer ${
                    contract === opt.value
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:border-purple-400/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </form>
    </motion.div>
  )
}

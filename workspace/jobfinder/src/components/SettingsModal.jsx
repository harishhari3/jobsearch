import { motion, AnimatePresence } from 'framer-motion'
import { X, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function SettingsModal({ open, initialAppId, initialAppKey, hasCreds, onSave, onClose }) {
  const [appId, setAppId] = useState('')
  const [appKey, setAppKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      setAppId(initialAppId)
      setAppKey(initialAppKey)
      setShowKey(false)
      setSaved(false)
    }
  }, [open, initialAppId, initialAppKey])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(appId.trim(), appKey.trim())
    setSaved(true)
    setTimeout(onClose, 700)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-md overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -30, scale: 0.7 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-600/40"
                >
                  <KeyRound size={18} />
                </motion.div>
                <div>
                  <h3 className="font-display text-base font-bold">Adzuna API Credentials</h3>
                  <p className="text-xs text-slate-400">Unlock live job data</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5">
              {hasCreds && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
                  <CheckCircle2 size={15} className="shrink-0" />
                  Credentials already configured — update them anytime.
                </div>
              )}

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  App ID
                </label>
                <input
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="e.g. a1b2c3d4"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-purple-500/60 focus:bg-white/10"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  App Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    placeholder="e.g. xyz123...secret"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-purple-500/60 focus:bg-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <p className="mb-5 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                <span>
                  Get a free App ID &amp; Key by registering at{' '}
                  <a
                    href="https://developer.adzuna.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-purple-300 hover:text-purple-200"
                  >
                    developer.adzuna.com <ExternalLink size={11} />
                  </a>
                  . Your key is stored only in your browser.
                </span>
              </p>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3.5 font-semibold text-white btn-glow cursor-pointer"
              >
                {saved ? 'Saved!' : 'Save & Enable Live Search'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

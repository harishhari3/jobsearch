import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, GraduationCap, Briefcase, Loader2, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ResumeModal({ uploading, fileName, text, onClose, onConfirm }) {
  const [level, setLevel] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (text || uploading) {
      setLevel(null)
      setConfirmed(false)
    }
  }, [text, uploading])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!uploading && !text) return null

  const handleConfirm = () => {
    setConfirmed(true)
    setTimeout(() => onConfirm(level), 650)
  }

  return (
    <AnimatePresence>
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
          className="glass-strong relative w-full max-w-lg overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-pink-600/40"
              >
                <FileText size={18} />
              </motion.div>
              <div>
                <h3 className="font-display text-base font-bold">
                  {uploading ? 'Reading your resume…' : 'Resume uploaded'}
                </h3>
                <p className="max-w-56 truncate text-xs text-slate-400">{fileName}</p>
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

          <div className="px-6 py-5">
            {uploading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 size={34} className="animate-spin text-purple-400" />
                <p className="mt-4 text-sm text-slate-400">Extracting text from your PDF…</p>
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-2xl bg-white/5 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-purple-300">
                    Extracted preview
                  </p>
                  <p className="max-h-28 overflow-hidden text-xs leading-relaxed text-slate-400">
                    {text ? summarizePreview(text) : 'No text found in this PDF.'}
                  </p>
                </div>

                <p className="mb-3 text-center text-sm font-medium text-slate-200">
                  What kind of candidate are you?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setLevel('fresher')}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all cursor-pointer ${
                      level === 'fresher'
                        ? 'border-emerald-500/60 bg-emerald-500/15 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                        : 'border-white/10 bg-white/5 hover:border-emerald-500/40'
                    }`}
                  >
                    <motion.span
                      animate={level === 'fresher' ? { y: [0, -4, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 1.4 }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300"
                    >
                      <GraduationCap size={22} />
                    </motion.span>
                    <span className="font-semibold text-slate-100">Fresher</span>
                    <span className="text-center text-xs text-slate-400">New to the field, entry-level ready</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setLevel('experienced')}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all cursor-pointer ${
                      level === 'experienced'
                        ? 'border-purple-500/60 bg-purple-500/15 shadow-lg shadow-purple-500/20 scale-[1.02]'
                        : 'border-white/10 bg-white/5 hover:border-purple-500/40'
                    }`}
                  >
                    <motion.span
                      animate={level === 'experienced' ? { rotate: [0, -8, 8, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300"
                    >
                      <Briefcase size={22} />
                    </motion.span>
                    <span className="font-semibold text-slate-100">Experienced</span>
                    <span className="text-center text-xs text-slate-400">Has professional work experience</span>
                  </motion.button>
                </div>

                <motion.button
                  whileHover={level ? { scale: 1.02 } : {}}
                  whileTap={level ? { scale: 0.97 } : {}}
                  disabled={!level}
                  onClick={handleConfirm}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white transition-all cursor-pointer ${
                    level
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 btn-glow'
                      : 'bg-white/10 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {confirmed ? (
                    <>
                      <CheckCircle2 size={18} className="animate-pulse" /> Saved!
                    </>
                  ) : (
                    'Save Resume'
                  )}
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function summarizePreview(text, words = 70) {
  const clean = text.replace(/[•▪◦●]/g, ' • ')
  const parts = clean.split(/\s+/)
  return parts.slice(0, words).join(' ') + (parts.length > words ? '…' : '')
}

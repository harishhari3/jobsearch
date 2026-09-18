import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MapPin, Clock, ExternalLink, Bookmark, BookmarkCheck, Building2,
  CalendarDays, Tag, Wallet, Briefcase,
} from 'lucide-react'
import { useEffect } from 'react'
import { formatSalary, timeAgo, initials } from '../utils/format'

const GRADIENTS = [
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-fuchsia-500 to-purple-500',
]

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function DetailRow({ icon: Icon, label, value, accent = 'text-purple-400' }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
      <Icon size={17} className={`shrink-0 ${accent}`} />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
        <div className="truncate text-sm font-medium text-slate-200">{value}</div>
      </div>
    </div>
  )
}

export default function JobDetailModal({ job, saved, onToggleSave, onClose }) {
  useEffect(() => {
    if (!job) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const original = document.body.style.overflow
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = original
    }
  }, [job, onClose])

  if (!job) return null

  const gradient = GRADIENTS[hashCode(job.company?.display_name || job.title) % GRADIENTS.length]
  const companyName = job.company?.display_name || 'Confidential'
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_is_predicted)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 md:items-center md:p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl md:rounded-3xl"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <h3 className="font-display text-lg font-bold">Job Details</h3>
            <motion.button
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X size={17} />
            </motion.button>
          </div>

          <div className="overflow-y-auto px-6 py-5">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} font-display text-xl font-bold text-white shadow-xl shadow-purple-900/40`}
              >
                {initials(companyName)}
              </motion.div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold leading-snug text-white">{job.title}</h2>
                <p className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Building2 size={14} /> {companyName}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <DetailRow icon={MapPin} label="Location" value={job.location?.display_name || 'Remote'} accent="text-cyan-400" />
              <DetailRow icon={Wallet} label="Salary" value={salary} accent="text-emerald-400" />
              <DetailRow icon={Clock} label="Posted" value={timeAgo(job.created)} accent="text-amber-400" />
              <DetailRow icon={CalendarDays} label="Created" value={job.created ? new Date(job.created).toLocaleDateString() : '—'} accent="text-purple-400" />
              <DetailRow icon={Tag} label="Category" value={job.category?.label || 'General'} accent="text-fuchsia-400" />
              <DetailRow icon={Briefcase} label="Contract" value={job.contract_time || 'Flexible'} accent="text-indigo-400" />
            </div>

            <div className="mt-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                About this role
              </h4>
              <div
                className="prose-invert max-h-56 overflow-y-auto rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-slate-300"
                dangerouslySetInnerHTML={{
                  __html: (job.description || 'No description provided.').slice(0, 3000),
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-white/5 px-6 py-4">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              href={job.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3.5 font-semibold text-white btn-glow cursor-pointer"
            >
              Apply Now <ExternalLink size={17} />
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onToggleSave(job)}
              className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold border transition-colors cursor-pointer ${
                saved
                  ? 'border-pink-500/50 bg-pink-500/15 text-pink-400'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/40'
              }`}
            >
              {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
              {saved ? 'Saved' : 'Save'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

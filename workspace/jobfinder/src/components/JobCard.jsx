import { motion } from 'framer-motion'
import { MapPin, Clock, Bookmark, BookmarkCheck, ArrowUpRight, Flame, Wifi } from 'lucide-react'
import TiltCard from './TiltCard'
import { formatSalaryShort, timeAgo, initials } from '../utils/format'

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

export default function JobCard({ job, index, onOpen, saved, onToggleSave }) {
  const gradient = GRADIENTS[hashCode(job.company?.display_name || job.title) % GRADIENTS.length]
  const salary = formatSalaryShort(job.salary_min, job.salary_max)
  const companyName = job.company?.display_name || 'Confidential'
  const location = job.location?.display_name || 'Remote / Anywhere'
  const createdAt = job.created ? new Date(job.created).getTime() : 0
  const isNew = createdAt && Date.now() - createdAt < 24 * 3600 * 1000
  const isRemote = /remote/i.test(location) || /remote/i.test(job.location?.area || '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: (index % 6) * 0.07, type: 'spring', stiffness: 130, damping: 18 }}
      className="h-full cursor-pointer"
      onClick={() => onOpen(job)}
    >
      <TiltCard border className="h-full rounded-2xl">
        <article className="glass group relative flex h-full flex-col rounded-2xl p-5 transition-all duration-300 card-shine hover:border-transparent hover:shadow-2xl hover:shadow-purple-950/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3" style={{ transform: 'translateZ(40px)' }}>
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} font-display text-base font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}>
                {initials(companyName)}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-[#0e0e1a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-[15px] text-slate-100 group-hover:text-white transition-colors">
                  {job.title}
                </h3>
                <p className="truncate text-sm text-slate-400">{companyName}</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleSave(job)
              }}
              aria-label={saved ? 'Remove from saved' : 'Save job'}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                saved
                  ? 'border-pink-500/50 bg-pink-500/15 text-pink-400'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/30'
              }`}
            >
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </motion.button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2" style={{ transform: 'translateZ(30px)' }}>
            {isNew && (
              <span className="flex items-center gap-1 rounded-lg bg-pink-500/15 border border-pink-500/40 px-2.5 py-1 text-xs font-bold text-pink-300">
                <Flame size={12} /> NEW
              </span>
            )}
            {salary && (
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                💰 {salary}
              </span>
            )}
            {isRemote && (
              <span className="flex items-center gap-1 rounded-lg bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 text-xs font-medium text-teal-300">
                <Wifi size={12} /> Remote
              </span>
            )}
            {job.contract_time && (
              <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 text-xs font-medium text-cyan-300">
                {job.contract_time}
              </span>
            )}
            {job.category?.label && (
              <span className="rounded-lg bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-xs font-medium text-purple-300">
                {job.category.label}
              </span>
            )}
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400" style={{ transform: 'translateZ(20px)' }}>
            {job.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 140).trim()}
            {'…'}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3.5" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-cyan-400" />
                <span className="max-w-40 truncate">{location}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-amber-400" />
                {timeAgo(job.created)}
              </span>
            </div>

            <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-purple-300 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-purple-500/20">
              View <ArrowUpRight size={12} />
            </span>
          </div>

          <span
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
            style={{ transform: 'translateZ(10px)' }}
          >
            <span className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ animation: 'sheen 2.5s ease-in-out infinite' }} />
          </span>
        </article>
      </TiltCard>
    </motion.div>
  )
}

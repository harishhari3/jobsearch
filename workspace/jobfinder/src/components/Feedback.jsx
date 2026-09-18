import { motion } from 'framer-motion'
import { Bookmark, KeyRound, AlertTriangle } from 'lucide-react'

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="shimmer-line h-12 w-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="shimmer-line h-4 w-3/4 rounded-lg" />
          <div className="shimmer-line h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="shimmer-line h-6 w-20 rounded-lg" />
        <div className="shimmer-line h-6 w-24 rounded-lg" />
        <div className="shimmer-line h-6 w-16 rounded-lg" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="shimmer-line h-3 w-full rounded-lg" />
        <div className="shimmer-line h-3 w-5/6 rounded-lg" />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="shimmer-line h-3 w-28 rounded-lg" />
        <div className="shimmer-line h-6 w-14 rounded-lg" />
      </div>
    </div>
  )
}

export function JobGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  )
}

export function MissingKeyState({ onOpenSettings }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120 }}
      className="glass mx-auto mt-10 max-w-lg rounded-3xl p-10 text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-xl shadow-purple-600/40"
      >
        <KeyRound size={28} />
      </motion.div>
      <h3 className="font-display text-xl font-bold">Connect your Job API</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
        To start searching live jobs, add your free Adzuna API App ID and Key.
        It takes less than a minute.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenSettings}
        className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-7 py-3 font-semibold text-white btn-glow cursor-pointer"
      >
        Add API Key
      </motion.button>
    </motion.div>
  )
}

export function ErrorState({ error, onRetry }) {
  const messages = {
    invalid_credentials: {
      title: 'Live feed warming up',
      desc: 'The live job feed is connecting right now. Give it a moment and try your search again.',
    },
    missing_credentials: {
      title: 'Live feed warming up',
      desc: 'The live job feed is connecting right now. Give it a moment and try your search again.',
    },
    network: {
      title: 'Network error',
      desc: 'Could not reach the job service. Check your connection and try again.',
    },
    server: {
      title: 'Something went wrong',
      desc: 'The job service returned an error. Please try again in a moment.',
    },
    not_found: {
      title: 'No results found',
      desc: 'Try different keywords, location, or country.',
    },
  }
  const m = messages[error] || messages.server

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mx-auto mt-10 max-w-md rounded-3xl p-10 text-center"
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
        <AlertTriangle size={28} />
      </div>
      <h3 className="font-display text-xl font-bold">{m.title}</h3>
      <p className="mt-2 text-sm text-slate-400">{m.desc}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        Try again
      </button>
    </motion.div>
  )
}

export function EmptyJobs({ hasQuery }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mx-auto mt-10 max-w-md rounded-3xl p-10 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -6, 6, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
      >
        <Bookmark size={28} />
      </motion.div>
      <h3 className="font-display text-xl font-bold">
        {hasQuery ? 'No matching jobs' : 'Start exploring'}
      </h3>
      <p className="mt-2 text-sm text-slate-400">
        {hasQuery
          ? 'We couldn\'t find jobs for that search. Try broader keywords or another country.'
          : 'Use the search bar above to find your dream role, or browse the popular categories.'}
      </p>
    </motion.div>
  )
}

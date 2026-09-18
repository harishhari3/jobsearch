import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, total, onPage }) {
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-purple-400/40 transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </motion.button>

        {pages.map((p) => (
          <motion.button
            key={p}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onPage(p)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl font-semibold transition-all cursor-pointer ${
              p === page
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-600/40 scale-110'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:border-purple-400/40'
            }`}
          >
            {p}
          </motion.button>
        ))}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-purple-400/40 transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>
      <p className="text-xs text-slate-500">
        Page {page} of {totalPages} · {total.toLocaleString()} jobs found
      </p>
    </div>
  )
}

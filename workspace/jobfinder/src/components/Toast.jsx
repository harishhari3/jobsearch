import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: KeyRound,
}

const COLORS = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-purple-300',
}

export default function Toast({ toast, onClose }) {
  if (!toast) return null
  const Icon = ICONS[toast.type] || ICONS.info

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2">
      <AnimatePresence>
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="glass-strong flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl"
        >
          <Icon size={19} className={COLORS[toast.type] || COLORS.info} />
          <span className="text-sm font-medium text-slate-100">{toast.message}</span>
          <button
            onClick={onClose}
            className="ml-2 text-slate-500 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

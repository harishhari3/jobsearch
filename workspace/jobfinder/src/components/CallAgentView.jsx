import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Phone, X } from 'lucide-react'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const AGENT_SRC = `/aethercall/index.html${GEMINI_KEY ? `?key=${encodeURIComponent(GEMINI_KEY)}` : ''}`

export default function CallAgentView({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a13]"
        >
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0e0e1a] px-4 py-3 md:px-6"
          >
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                Back to Jobs
              </motion.button>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" style={{ animation: 'pingSoft 1.5s ease-out infinite' }} />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Phone size={15} className="text-purple-400" />
                  AetherCall — Voice Agent
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close calling agent"
            >
              <X size={17} />
            </button>
          </motion.div>

          <div className="relative flex-1">
            <iframe
              src={AGENT_SRC}
              title="AetherCall Voice Agent"
              className="h-full w-full border-0"
              allow="microphone; camera; autoplay; clipboard-write"
              allowFullScreen
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

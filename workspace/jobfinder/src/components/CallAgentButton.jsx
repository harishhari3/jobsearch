import { motion } from 'framer-motion'
import { Phone, ArrowUpRight } from 'lucide-react'

export default function CallAgentButton({ onOpen }) {
  return (
    <motion.button
      onClick={onOpen}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.4, type: 'spring', stiffness: 200, damping: 16 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="group fixed bottom-6 right-6 z-[75] block cursor-pointer"
      aria-label="Open AI voice agent"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 opacity-40 animate-ping" />
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        className="relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-5 py-3.5 font-semibold text-white shadow-2xl shadow-purple-600/40 btn-glow"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-70" style={{ animation: 'pingSoft 1.4s ease-out infinite' }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <Phone size={17} className="transition-transform duration-300 group-hover:rotate-12" />
        Voice Agent
        <ArrowUpRight
          size={15}
          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </motion.div>
    </motion.button>
  )
}

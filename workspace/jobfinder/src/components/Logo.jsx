import { motion } from 'framer-motion'

export default function Logo({ size = 40 }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <motion.div
        whileHover={{ rotate: 12, scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/40"
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 animate-pulse-glow" />
        <svg
          width={size * 0.62}
          height={size * 0.62}
          viewBox="0 0 64 64"
          fill="none"
          className="relative"
        >
          <circle cx="32" cy="32" r="20" stroke="#fff" strokeWidth="7" />
          <path d="M32 14a18 18 0 0 1 0 36z" fill="#fff" opacity="0.95" />
          <circle cx="32" cy="32" r="7" fill="#8b5cf6" />
        </svg>
      </motion.div>
      <div className="leading-none">
        <span className="font-display text-xl font-bold tracking-tight">
          Job<span className="gradient-text">Pulse</span>
        </span>
        <span className="block text-[10px] uppercase tracking-[0.28em] text-slate-400">
          Careers, live
        </span>
      </div>
    </div>
  )
}

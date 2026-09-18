import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Briefcase, Globe2, Building2, TrendingUp } from 'lucide-react'

function CountUp({ to, duration = 1.6 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = null
    let raf
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * to))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return <span ref={ref}>{val.toLocaleString()}</span>
}

const STATS = [
  { icon: Briefcase, value: 125000, suffix: '+', label: 'Live job postings' },
  { icon: Globe2, value: 17, suffix: '', label: 'Countries covered' },
  { icon: Building2, value: 80000, suffix: '+', label: 'Hiring companies' },
  { icon: TrendingUp, value: 99, suffix: '%', label: 'Fresh roles daily' },
]

export default function StatsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4"
    >
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
          whileHover={{ y: -6 }}
          className="glass group relative rounded-2xl p-5 text-center overflow-hidden card-shine"
        >
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-pink-500/30 border border-purple-500/20 transition-transform group-hover:scale-110 group-hover:rotate-6">
            <stat.icon size={20} className="text-purple-300" />
          </div>
          <div className="font-display text-2xl font-bold md:text-3xl">
            <CountUp to={stat.value} />
            {stat.suffix}
          </div>
          <div className="mt-1 text-xs text-slate-400 md:text-sm">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}

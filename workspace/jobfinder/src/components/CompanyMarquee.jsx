import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Stripe', 'Shopify',
  'Spotify', 'Airbnb', 'Uber', 'Salesforce', 'Adobe', 'IBM', 'Intel', 'Nvidia',
  'Tesla', 'Deloitte', 'Accenture', 'Docker',
]

const DOT_GRADIENTS = [
  'from-indigo-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-cyan-400 to-blue-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-fuchsia-400 to-purple-500',
]

export default function CompanyMarquee() {
  const items = [...COMPANIES, ...COMPANIES]
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="mx-auto mt-20 max-w-6xl px-6"
    >
      <div className="flex items-center justify-center gap-2.5 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
        <Star size={13} className="text-amber-400" />
        Hiring at 80,000+ companies worldwide
        <Star size={13} className="text-amber-400" />
      </div>

      <div className="group relative mt-7 overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max items-center gap-4 animate-marquee group-hover:[animation-play-state:paused]">
          {items.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="glass flex items-center gap-2.5 whitespace-nowrap rounded-2xl px-6 py-3 transition-colors hover:border-purple-400/30"
            >
              <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${DOT_GRADIENTS[i % DOT_GRADIENTS.length]}`} />
              <span className="font-display text-lg font-bold text-slate-300">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

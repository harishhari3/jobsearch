import { motion } from 'framer-motion'
import { Github, Twitter, Linkedin, Heart, Zap } from 'lucide-react'
import { MARQUEE_TECH } from '../config'

export function TechMarquee() {
  const items = [...MARQUEE_TECH, ...MARQUEE_TECH]
  return (
    <div className="relative mt-16 overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max gap-3 animate-marquee">
        {items.map((tech, i) => (
          <span
            key={`${tech}-${i}`}
            className="glass flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm text-slate-400"
          >
            <Zap size={13} className="text-purple-400" />
            {tech}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5">
      <TechMarquee />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <div className="text-center md:text-left">
          <div className="font-display text-lg font-bold">
            Job<span className="gradient-text">Pulse</span>
          </div>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            Beautifully animated job discovery powered by the Adzuna API.
            Find, save and apply to your dream role in seconds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {[Github, Twitter, Linkedin].map((Icon, i) => (
            <motion.a
              key={i}
              href="#"
              onClick={(e) => e.preventDefault()}
              whileHover={{ y: -4, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-purple-400/40 transition-colors"
              aria-label="Social link"
            >
              <Icon size={17} />
            </motion.a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-600">
        Crafted with <Heart size={11} className="inline text-pink-500 animate-pulse" /> for job seekers everywhere · Powered by Adzuna
      </div>
    </footer>
  )
}

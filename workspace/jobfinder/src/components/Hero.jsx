import { motion, useMotionValue, useSpring, useMotionTemplate, useTransform } from 'framer-motion'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const ROTATING_WORDS = ['Dream Job', 'Career', 'Future', 'Passion', 'Adventure', 'Calling']

const TYPEWRITER_PHRASES = [
  'Fresh openings from 17 countries, updated in real-time',
  'AI-powered matching across 80,000+ hiring companies',
  'Find remote, hybrid or on-site roles that fit you',
  'Your next role is one search away',
]

function useRotatingWord(words) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), 2400)
    return () => clearInterval(id)
  }, [words.length])
  return words[index]
}

function useTypewriter(phrases) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState(0)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const phrase = phrases[phase % phrases.length]
    let t
    if (idx < phrase.length) {
      t = setTimeout(() => {
        setText(phrase.slice(0, idx + 1))
        setIdx(idx + 1)
      }, 32)
    } else {
      t = setTimeout(() => {
        setPhase((p) => p + 1)
        setIdx(0)
        setText('')
      }, 2200)
    }
    return () => clearTimeout(t)
  }, [idx, phase, phrases])

  return text
}

function IsometricGrid() {
  return (
    <div
      className="absolute inset-x-0 -top-10 bottom-0 -z-10 opacity-[0.05] light:opacity-[0.04]"
      style={{
        transform: 'translate(-50%, -8%) skewX(-48deg) skewY(14deg)',
        left: '50%',
        width: '200vw',
        height: '120vh',
        backgroundImage:
          'linear-gradient(rgba(129,140,248,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.9) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        willChange: 'transform',
      }}
    />
  )
}

function Magnetic({ children }) {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 200, damping: 14 })
  const y = useSpring(my, { stiffness: 200, damping: 14 })

  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left - rect.width / 2) * 0.25)
    my.set((e.clientY - rect.top - rect.height / 2) * 0.25)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      style={{ x, y }}
      className="inline-block"
    >
      {children}
    </motion.div>
  )
}

function FloatingJobCard({ className, style, innerClassName, children }) {
  return (
    <motion.div className={`pointer-events-none absolute hidden lg:block ${className}`} style={style}>
      <motion.div className={innerClassName} animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut' }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

export default function Hero({ onQuickSearch }) {
  const word = useRotatingWord(ROTATING_WORDS)
  const typeText = useTypewriter(TYPEWRITER_PHRASES)

  const sectionRef = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const springMx = useSpring(mx, { stiffness: 80, damping: 20 })
  const springMy = useSpring(my, { stiffness: 80, damping: 20 })

  const orbOneX = useTransform(springMx, [0, 1], [-40, 40])
  const orbOneY = useTransform(springMy, [0, 1], [-30, 30])
  const orbTwoX = useTransform(springMx, [0, 1], [30, -30])
  const orbTwoY = useTransform(springMy, [0, 1], [25, -25])

  const cardLeftX = useTransform(springMx, [0, 1], [-26, 26])
  const cardLeftY = useTransform(springMy, [0, 1], [-18, 18])
  const cardRightX = useTransform(springMx, [0, 1], [26, -26])
  const cardRightY = useTransform(springMy, [0, 1], [18, -18])

  const spotlight = useMotionTemplate`radial-gradient(560px circle at ${springMx}px ${springMy}px, rgba(168,85,247,0.12), transparent 65%)`

  const handleMouse = (e) => {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    mx.set(e.clientX - rect.left)
    my.set(e.clientY - rect.top)
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  }
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
  }

  const quickSearches = [
    { emoji: '🤖', label: 'AI Engineer', q: 'ai engineer' },
    { emoji: '💻', label: 'Frontend Dev', q: 'frontend developer' },
    { emoji: '📊', label: 'Data Scientist', q: 'data scientist' },
    { emoji: '☁️', label: 'DevOps', q: 'devops' },
  ]

  return (
    <motion.section
      ref={sectionRef}
      onMouseMove={handleMouse}
      variants={container}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden pt-36 pb-10 text-center md:pt-44"
    >
      <IsometricGrid />
      <motion.div style={{ maskImage: spotlight, WebkitMaskImage: spotlight }} className="pointer-events-none absolute inset-0 -z-10" />

      <motion.div style={{ x: orbOneX, y: orbOneY }} className="pointer-events-none absolute -left-16 top-24 -z-10">
        <div className="h-40 w-40 rounded-full border border-purple-500/25 bg-purple-500/10 blur-2xl animate-float" />
      </motion.div>
      <motion.div style={{ x: orbTwoX, y: orbTwoY }} className="pointer-events-none absolute -right-10 bottom-10 -z-10">
        <div className="h-32 w-32 rounded-full border border-pink-500/25 bg-pink-500/10 blur-2xl animate-float-slow" />
      </motion.div>

      <FloatingJobCard
        className="left-8 top-40"
        style={{ x: cardLeftX, y: cardLeftY, rotate: -6 }}
        innerClassName="glass-strong w-60 rounded-2xl border border-purple-500/25 p-4 shadow-2xl shadow-purple-950/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 font-display text-sm font-bold text-white shadow-lg">
            G
          </div>
          <div className="min-w-0 text-left">
            <div className="truncate text-sm font-semibold text-white">Frontend Engineer</div>
            <div className="truncate text-xs text-slate-400">Google · Remote</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-left">
          <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
            $120k – $160k
          </span>
          <span className="text-[11px] text-slate-500">2h ago</span>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>Match score</span>
            <span className="text-purple-300">96%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-indigo-500 to-pink-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 0.96 }}
              transition={{ delay: 1.2, duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </div>
      </FloatingJobCard>

      <FloatingJobCard
        className="right-8 bottom-20"
        style={{ x: cardRightX, y: cardRightY, rotate: 6 }}
        innerClassName="glass-strong w-60 rounded-2xl border border-cyan-500/25 p-4 shadow-2xl shadow-cyan-950/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 font-display text-sm font-bold text-white shadow-lg">
            O
          </div>
          <div className="min-w-0 text-left">
            <div className="truncate text-sm font-semibold text-white">AI Researcher</div>
            <div className="truncate text-xs text-slate-400">OpenAI · Hybrid</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-left">
          <span className="flex items-center gap-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
            <Sparkles size={11} /> Gemini 3.5
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            <CheckCircle2 size={11} /> Shortlisted
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {['from-indigo-400 to-purple-400', 'from-pink-400 to-rose-400', 'from-amber-400 to-orange-400'].map((g) => (
              <div key={g} className={`h-5 w-5 rounded-full border-2 border-[#151528] bg-gradient-to-br ${g}`} />
            ))}
          </div>
          <span className="text-[11px] text-slate-400">4.9 team rating</span>
        </div>
      </FloatingJobCard>

      <motion.div
        variants={item}
        className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300"
      >
        <Sparkles size={15} className="animate-pulse" />
        Fresh jobs updated in real-time
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400" style={{ animation: 'pingSoft 1.5s ease-out infinite' }} />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      </motion.div>

      <div className="relative">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[24rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-600/25 via-fuchsia-500/20 to-cyan-400/20 blur-[110px]"
          style={{ animation: 'aurora 9s ease-in-out infinite' }}
        />
        <motion.h1
          variants={item}
          className="font-display mx-auto max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight md:text-7xl"
        >
          Discover your
          <br />
          <span className="inline-block min-h-[1.2em]">
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 24, rotateX: 90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="gradient-text inline-block"
            >
              {word}
            </motion.span>
          </span>
        </motion.h1>
      </div>

      <motion.div variants={item} className="mx-auto mt-6 flex h-6 max-w-2xl items-center justify-center gap-1 text-base text-slate-400 md:text-lg">
        <span className="text-purple-400">›</span>
        <span className="text-left">{typeText}</span>
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.9 }}
          className="-ml-0.5 inline-block h-5 w-[2px] bg-purple-400"
        />
      </motion.div>

      <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {quickSearches.map((s, i) => (
          <Magnetic key={s.label}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              onClick={() => onQuickSearch(s.q)}
              className="glass rounded-full px-4 py-2 text-sm text-slate-200 hover:border-purple-400/50 hover:text-white transition-colors cursor-pointer"
            >
              <span className="mr-1.5 inline-block animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
                {s.emoji}
              </span>
              {s.label}
            </motion.button>
          </Magnetic>
        ))}
      </motion.div>

      <motion.div variants={item} className="mt-16 flex justify-center">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-slate-600 p-1.5"
        >
          <motion.span
            animate={{ y: [0, 14, 0], opacity: [1, 0.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="h-1.5 w-1.5 rounded-full bg-purple-400"
          />
        </motion.div>
      </motion.div>
    </motion.section>
  )
}

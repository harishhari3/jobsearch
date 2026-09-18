import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function DogSvg({ running }) {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 160)
    }, 3600)
    return () => clearInterval(id)
  }, [])

  return (
    <svg width="94" height="98" viewBox="0 0 92 96" fill="none">
      <g
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'left center',
          animation: running ? 'wagFast 0.45s linear infinite' : 'wag 2.6s ease-in-out infinite',
        }}
      >
        <path d="M66 32 Q78 16 86 20 Q80 32 70 36 Z" fill="#8b5cf6" />
        <path d="M66 32 Q70 26 76 24" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
      </g>

      <g style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <ellipse cx="45" cy="80" rx="22" ry="13" fill="#a78bfa" />
        <ellipse cx="45" cy="75" rx="13" ry="9" fill="#ede9fe" />
      </g>

      <g style={{ transformBox: 'fill-box', transformOrigin: 'top center', animation: running ? 'runLeft 0.4s linear infinite' : 'none' }}>
        <rect x="29" y="88" width="11" height="9" rx="4" fill="#7c3aed" />
      </g>
      <g style={{ transformBox: 'fill-box', transformOrigin: 'top center', animation: running ? 'runRight 0.4s linear infinite' : 'none' }}>
        <rect x="50" y="88" width="11" height="9" rx="4" fill="#6d28d9" />
      </g>

      <g transform="translate(10,0)">
        <path d="M16 30 Q6 10 22 9 Q30 13 25 29 Z" fill="#8b5cf6" />
        <path d="M56 30 Q66 10 50 9 Q42 13 47 29 Z" fill="#7c3aed" />
        <path d="M16 30 Q12 36 14 40 Q9 34 16 30 Z" fill="#a78bfa" />
        <path d="M56 30 Q60 36 58 40 Q63 34 56 30 Z" fill="#8b5cf6" />
        <circle cx="36" cy="40" r="23" fill="#a78bfa" />
        <circle cx="36" cy="40" r="23" stroke="#7c3aed" strokeWidth="1.5" opacity="0.4" />
        <path d="M21 47 Q36 60 51 47 Q47 68 36 69.5 Q25 68 21 47 Z" fill="#ede9fe" />
        <circle cx="27" cy="37" r={blink ? 0.4 : 4.2} fill="#2e1065" />
        <circle cx="45" cy="37" r={blink ? 0.4 : 4.2} fill="#2e1065" />
        <circle cx="28.6" cy="35.2" r="1.5" fill="#fff" />
        <circle cx="46.6" cy="35.2" r="1.5" fill="#fff" />
        <ellipse cx="36" cy="46" rx="5" ry="4" fill="#2e1065" />
        <circle cx="34" cy="45" r="1" fill="#c4b5fd" opacity="0.7" />
        <circle cx="38" cy="45" r="1" fill="#c4b5fd" opacity="0.7" />
        <path d="M36 50 Q30.5 56 25.5 52.5" stroke="#2e1065" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 50 Q41.5 56 46.5 52.5" stroke="#2e1065" strokeWidth="2" strokeLinecap="round" />
        <path d="M34.5 53 Q36 59 37.5 53 Q36 52 34.5 53 Z" fill="#f472b6" />
        <path d="M34.8 54 Q36 57.4 37.2 54" stroke="#fda4af" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export default function CursorFollower() {
  const [active, setActive] = useState(false)
  const [facing, setFacing] = useState(1)
  const [running, setRunning] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.5 })
  const gx = useSpring(x, { stiffness: 60, damping: 20, mass: 0.9 })
  const gy = useSpring(y, { stiffness: 60, damping: 20, mass: 0.9 })

  const prev = useRef({ x: 0, t: 0 })

  useEffect(() => {
    let slow
    const onMove = (e) => {
      const now = Date.now()
      const vx = e.clientX - prev.current.x
      const dt = Math.max(16, now - prev.current.t)
      const speed = Math.abs(vx) / dt
      if (Math.abs(vx) > 1.5) setFacing(vx < 0 ? 1 : -1)
      setActive(true)
      setRunning(speed > 0.25)
      clearTimeout(slow)
      slow = setTimeout(() => setRunning(false), 180)
      prev.current = { x: e.clientX, t: now }
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      clearTimeout(slow)
      window.removeEventListener('mousemove', onMove)
    }
  }, [x, y])

  return (
    <>
      <motion.div
        style={{ x: gx, y: gy }}
        className="pointer-events-none fixed left-0 top-0 z-[55]"
        animate={{ opacity: active ? 0.9 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="-translate-x-1/2 -translate-y-1/2">
          <div
            className="h-24 w-24 blur-xl"
            style={{
              background:
                'radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(236,72,153,0.28) 45%, transparent 70%)',
            }}
          />
        </div>
      </motion.div>

      <motion.div
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed left-0 top-0 z-[60]"
        animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.4, scaleX: facing }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { type: 'spring', stiffness: 260, damping: 18 },
          scaleX: { duration: 0.2 },
        }}
      >
        <motion.div
          className="-translate-x-1/2 -translate-y-1/2 drop-shadow-[0_10px_18px_rgba(139,92,246,0.5)]"
          animate={running ? { y: [0, -5, 0], rotate: [0, 4, -4, 0] } : { y: [0, -7, 0], rotate: [0, 2.5, -2.5, 0] }}
          transition={{ repeat: Infinity, duration: running ? 0.4 : 2.6, ease: 'easeInOut' }}
        >
          <DogSvg running={running} />
        </motion.div>
      </motion.div>
    </>
  )
}

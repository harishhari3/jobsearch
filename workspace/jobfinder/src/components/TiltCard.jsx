import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'

export default function TiltCard({ children, className = '', border = false, tilt = 8, onMouseLeave }) {
  const ref = useRef(null)

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(py, [0, 1], [tilt, -tilt]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), { stiffness: 200, damping: 20 })
  const scale = useSpring(useTransform(px, [0.5, 0.5], [1, 1]), { stiffness: 150, damping: 20 })

  const spotlightX = useTransform(px, (v) => `${v * 100}%`)
  const spotlightY = useTransform(py, (v) => `${v * 100}%`)
  const spotlight = useTransform(
    [spotlightX, spotlightY],
    ([sx, sy]) => `radial-gradient(320px circle at ${sx} ${sy}, rgba(168,85,247,0.16), transparent 65%)`
  )

  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={(e) => {
        px.set(0.5)
        py.set(0.5)
        onMouseLeave?.(e)
      }}
      style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d', perspective: 900 }}
      className={`group relative ${border ? 'animated-border rounded-2xl' : ''} ${className}`}
    >
      <motion.div
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 -z-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

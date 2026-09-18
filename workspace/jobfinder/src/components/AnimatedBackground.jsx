export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a13] transition-colors duration-700" />
      <div className="light:hidden absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-transparent to-pink-950/40" />

      <div className="absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-indigo-600/30 blur-[130px] animate-blob" />
      <div className="absolute top-1/4 -right-40 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/25 blur-[130px] animate-blob [animation-delay:-6s]" />
      <div className="absolute -bottom-40 left-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-[140px] animate-blob [animation-delay:-12s]" />

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)',
        }}
      />

      <div className="absolute inset-0 opacity-[0.35] light:opacity-10">
        {[...Array(9)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/60"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animation: `float ${5 + (i % 4)}s ease-in-out ${i * 0.6}s infinite`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 opacity-[0.03] light:opacity-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)',
          backgroundSize: '140px 140px',
        }}
      />
    </div>
  )
}

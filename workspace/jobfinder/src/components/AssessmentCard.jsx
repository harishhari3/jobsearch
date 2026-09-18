import { motion } from 'framer-motion'
import { GraduationCap, Code2, BrainCircuit, Timer, BadgeCheck, Lock, Unlock, TrendingUp } from 'lucide-react'
import { EXAM_META } from '../data/assessment'

export default function AssessmentCard({ unlocked, lastScore, onUnlock, onStart }) {
  return (
    <motion.section
      id="exam-section"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="mx-auto mt-20 max-w-6xl px-6"
    >
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-950/70 via-[#141428] to-fuchsia-950/60" />
        <div className="pointer-events-none absolute -top-24 right-10 -z-10 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-[90px] animate-float" />
        <div className="pointer-events-none absolute -bottom-24 left-10 -z-10 h-64 w-64 rounded-full bg-indigo-600/20 blur-[90px] animate-float-slow" />

        <div className="flex flex-col items-start gap-8 p-8 md:flex-row md:items-center md:p-12">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-300">
                <GraduationCap size={13} /> Skill Exam
              </span>
              {unlocked && (
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <Unlock size={12} /> Unlocked
                </span>
              )}
            </div>

            <h2 className="font-display text-2xl font-bold md:text-4xl">
              Prove your skills with a <span className="gradient-text">proctored-style</span> mock exam
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
              A timed assessment of 3 DSA questions and 15 aptitude questions. Get an instant score,
              section-wise breakdown and full answer review with explanations.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: Code2, label: '3 DSA questions' },
                { icon: BrainCircuit, label: '15 aptitude questions' },
                { icon: Timer, label: `${EXAM_META.durationMin} minute timer` },
                { icon: BadgeCheck, label: 'Instant results + review' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-300">
                  <f.icon size={14} className="text-purple-400" /> {f.label}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full shrink-0 md:w-72">
            <div className="glass-strong rounded-3xl border border-white/10 p-6 text-center">
              {lastScore ? (
                <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <TrendingUp size={13} /> Last score: {lastScore.score}/{lastScore.total} ({lastScore.percent}%)
                </div>
              ) : (
                <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
                  <Timer size={13} /> {EXAM_META.durationMin} min · {EXAM_META.passPercent}%+ to pass
                </div>
              )}

              <div className="font-display text-4xl font-bold">
                <span className="gradient-text">{EXAM_META.currency}{EXAM_META.price}</span>
                <span className="text-sm text-slate-500"> / lifetime</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">One-time payment · unlimited retakes</p>

              {unlocked ? (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onStart}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3.5 font-semibold text-white btn-glow cursor-pointer"
                >
                  <Unlock size={16} /> {lastScore ? 'Retake Exam' : 'Take Exam'}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onUnlock}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3.5 font-semibold text-white btn-glow cursor-pointer"
                >
                  <Lock size={16} /> Unlock Exam
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

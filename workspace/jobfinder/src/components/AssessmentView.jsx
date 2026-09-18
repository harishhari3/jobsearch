import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Clock, Check, Flag, ChevronLeft, ChevronRight, Send, ClipboardList,
  RotateCcw, AlertTriangle, CircleDot,
} from 'lucide-react'
import { EXAM_QUESTIONS, EXAM_META, LETTERS } from '../data/assessment'

const DSA_COUNT = EXAM_META.dsaCount

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function ScoreRing({ percent, size = 120 }) {
  const r = 52
  const circ = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - percent / 100) }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="55%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold">{Math.round(percent)}%</span>
      </div>
    </div>
  )
}

export default function AssessmentView({ open, onClose, onComplete }) {
  const [phase, setPhase] = useState('exam')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [marked, setMarked] = useState(new Set())
  const [secondsLeft, setSecondsLeft] = useState(EXAM_META.durationMin * 60)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const submittedRef = useRef(false)

  const total = EXAM_QUESTIONS.length
  const q = EXAM_QUESTIONS[current]

  useEffect(() => {
    if (!open || phase !== 'exam') return
    const iv = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(iv)
  }, [open, phase])

  useEffect(() => {
    if (!open || phase !== 'exam') return
    if (secondsLeft <= 0 && !submittedRef.current) {
      submittedRef.current = true
      submit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, open, phase])

  useEffect(() => {
    if (open) {
      setPhase('exam')
      setCurrent(0)
      setAnswers({})
      setMarked(new Set())
      setSecondsLeft(EXAM_META.durationMin * 60)
      setConfirmOpen(false)
      setExitOpen(false)
      submittedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const answeredCount = Object.keys(answers).length

  const result = useMemo(() => {
    let dsaCorrect = 0
    let aptCorrect = 0
    for (const question of EXAM_QUESTIONS) {
      const chosen = answers[question.id]
      if (chosen === undefined) continue
      if (chosen === question.correct) {
        if (question.section === 'DSA') dsaCorrect += 1
        else aptCorrect += 1
      }
    }
    const score = dsaCorrect + aptCorrect
    const percent = Math.round((score / total) * 100)
    return {
      score,
      dsaCorrect,
      aptCorrect,
      percent,
      passed: percent >= EXAM_META.passPercent,
      dsaTotal: DSA_COUNT,
      aptTotal: total - DSA_COUNT,
    }
  }, [answers])

  function submit() {
    if (submittedRef.current) return
    submittedRef.current = true
    setConfirmOpen(false)
    setExitOpen(false)
    setPhase('results')
    onComplete?.(result)
  }

  if (!open) return null

  const selectAnswer = (optIndex) => {
    setAnswers((a) => ({ ...a, [q.id]: optIndex }))
  }

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(q.id)) next.delete(q.id)
      else next.add(q.id)
      return next
    })
  }

  const goTo = (i) => {
    setCurrent(i)
    setShowPalette(false)
  }

  const paletteBtn = (i) => {
    const question = EXAM_QUESTIONS[i]
    const answered = answers[question.id] !== undefined
    const isMarked = marked.has(question.id)
    const isCurrent = i === current
    let cls = 'border-white/10 bg-white/5 text-slate-400 hover:border-purple-400/40'
    if (answered && isMarked) cls = 'border-amber-500/60 bg-amber-500/20 text-amber-300'
    else if (answered) cls = 'border-indigo-500/60 bg-indigo-500/25 text-white'
    else if (isMarked) cls = 'border-amber-500/60 bg-amber-500/10 text-amber-300'
    if (isCurrent) cls += ' ring-2 ring-purple-400 scale-110'
    return (
      <button
        key={question.id}
        onClick={() => goTo(i)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition-all cursor-pointer ${cls}`}
      >
        {i + 1}
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col bg-[#0a0a13]"
    >
      {/* Header */}
      <header className="glass-strong z-10 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setExitOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-red-400/40 transition-colors cursor-pointer" aria-label="Exit exam">
            <X size={17} />
          </button>
          <div>
            <div className="font-display text-sm font-bold md:text-base">
              Job<span className="gradient-text">Pulse</span> Skill Exam
            </div>
            <div className="hidden text-[11px] text-slate-500 md:block">3 DSA · 15 Aptitude · {EXAM_META.durationMin} minutes</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-sm font-bold transition-colors ${
              secondsLeft < 60 ? 'border-red-500/50 bg-red-500/15 text-red-300 animate-pulse' : 'border-white/10 bg-white/5 text-purple-300'
            }`}
          >
            <Clock size={15} />
            {formatTime(secondsLeft)}
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer"
          >
            <Send size={15} /> <span className="hidden sm:inline">Submit</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar palette */}
        <aside
          className={`${showPalette ? 'flex' : 'hidden'} md:flex fixed inset-0 top-[57px] bottom-auto md:static md:bottom-0 md:w-60 z-20 flex-col border-r border-white/10 glass-strong md:glass p-4 md:min-h-0`}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Question palette</span>
            <button onClick={() => setShowPalette(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 md:hidden cursor-pointer">
              <X size={15} />
            </button>
          </div>

          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>DSA ({DSA_COUNT})</span>
            <span>Aptitude ({total - DSA_COUNT})</span>
          </div>
          <div className="grid grid-cols-6 gap-2 md:grid-cols-4">
            {EXAM_QUESTIONS.map((_, i) => paletteBtn(i))}
          </div>

          <div className="mt-5 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-indigo-500/60 border border-indigo-400/50" /> Answered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-amber-500/40 border border-amber-400/60" /> Marked for review</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-white/20 bg-white/5" /> Not attempted</div>
          </div>

          <div className="mt-auto pt-4 text-center text-[11px] text-slate-500">
            {answeredCount} / {total} answered
          </div>
        </aside>

        {showPalette && <div className="fixed inset-0 z-10 bg-black/60 md:hidden" onClick={() => setShowPalette(false)} />}

        {/* Main question area */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 md:px-10">
          <button
            onClick={() => setShowPalette(true)}
            className="mb-4 flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 md:hidden cursor-pointer"
          >
            <ClipboardList size={14} /> Question {current + 1} of {total}
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    q.section === 'DSA'
                      ? 'bg-purple-500/15 border border-purple-500/40 text-purple-300'
                      : 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  {q.section}
                </span>
                <span className="text-xs text-slate-500">Question {current + 1} / {total}</span>
                {marked.has(q.id) && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    <Flag size={10} /> Marked
                  </span>
                )}
              </div>

              <h2 className="max-w-2xl text-lg font-semibold leading-relaxed text-slate-100 md:text-xl">
                {q.question}
              </h2>

              {q.code && (
                <pre className="mt-4 max-w-2xl overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-sm text-emerald-300">
                  {q.code}
                </pre>
              )}

              <div className="mt-6 max-w-2xl space-y-2.5">
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === i
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => selectAnswer(i)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition-all cursor-pointer ${
                        selected
                          ? 'border-indigo-500/60 bg-indigo-500/15 text-white shadow-lg shadow-indigo-900/30'
                          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-purple-400/40 hover:bg-white/5'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                          selected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-white/15 bg-white/5 text-slate-400'
                        }`}
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="leading-relaxed">{opt}</span>
                      {selected && <Check size={16} className="ml-auto shrink-0 text-indigo-300" />}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer nav */}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
            <button
              onClick={toggleMark}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all cursor-pointer ${
                marked.has(q.id)
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/40'
              }`}
            >
              <Flag size={14} /> {marked.has(q.id) ? 'Marked' : 'Mark for review'}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goTo(Math.max(0, current - 1))}
                disabled={current === 0}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 hover:border-purple-400/40 transition-colors disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={15} /> Prev
              </button>
              {current < total - 1 ? (
                <button
                  onClick={() => goTo(current + 1)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
                >
                  Submit <Send size={14} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Results */}
      <AnimatePresence>
        {phase === 'results' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] overflow-y-auto bg-[#0a0a13] px-4 py-8"
          >
            <div className="mx-auto max-w-3xl">
              <div className="glass-strong rounded-3xl border border-white/10 p-8 text-center">
                <h2 className="font-display text-2xl font-bold md:text-3xl">
                  {result.passed ? 'Great job, you passed!' : 'Exam complete'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  You scored {result.score} out of {total} correct ({EXAM_META.passPercent}%+ to pass)
                </p>

                <div className="mt-6 flex items-center justify-center gap-8">
                  <ScoreRing percent={result.percent} />
                </div>

                <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-purple-500/25 bg-purple-500/10 p-4">
                    <div className="text-xs uppercase tracking-wider text-purple-300">DSA</div>
                    <div className="mt-1 font-display text-2xl font-bold">{result.dsaCorrect}<span className="text-sm text-slate-400">/{result.dsaTotal}</span></div>
                  </div>
                  <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4">
                    <div className="text-xs uppercase tracking-wider text-cyan-300">Aptitude</div>
                    <div className="mt-1 font-display text-2xl font-bold">{result.aptCorrect}<span className="text-sm text-slate-400">/{result.aptTotal}</span></div>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setPhase('exam')
                      setCurrent(0)
                      setAnswers({})
                      setMarked(new Set())
                      setSecondsLeft(EXAM_META.durationMin * 60)
                      submittedRef.current = false
                    }}
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-purple-400/40 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={15} /> Retake Exam
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white btn-glow cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Review */}
              <h3 className="mt-10 mb-4 font-display text-lg font-bold">Answer Review</h3>
              <div className="space-y-3">
                {EXAM_QUESTIONS.map((question) => {
                  const chosen = answers[question.id]
                  const isCorrect = chosen === question.correct
                  return (
                    <div key={question.id} className="glass rounded-2xl border border-white/10 p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                            isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {question.section === 'DSA' ? 'D' : 'A'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-200">{question.question}</p>
                          {question.code && (
                            <pre className="mt-2 overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-xs text-emerald-300">{question.code}</pre>
                          )}
                          <div className="mt-2 space-y-1 text-xs">
                            <p className={isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                              Your answer: {chosen !== undefined ? LETTERS[chosen] + ' · ' + question.options[chosen] : 'Not answered'}
                            </p>
                            {!isCorrect && (
                              <p className="text-emerald-300">
                                Correct answer: {LETTERS[question.correct]} · {question.options[question.correct]}
                              </p>
                            )}
                            <p className="text-slate-400">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit confirm */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-sm rounded-3xl p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <AlertTriangle size={22} />
              </div>
              <h3 className="font-display text-lg font-bold">Submit exam?</h3>
              <div className="mt-3 space-y-1.5 text-sm text-slate-400">
                <p>Answered: <span className="font-semibold text-slate-200">{answeredCount} / {total}</span></p>
                <p>Unanswered: <span className="font-semibold text-slate-200">{total - answeredCount}</span></p>
                {marked.size > 0 && <p>Marked for review: <span className="font-semibold text-amber-300">{marked.size}</span></p>}
                <p className="text-xs text-slate-500">Time remaining: {formatTime(secondsLeft)}</p>
              </div>
              <div className="mt-5 flex gap-2.5">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Keep working
                </button>
                <button
                  onClick={submit}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white cursor-pointer"
                >
                  Submit now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit confirm */}
      <AnimatePresence>
        {exitOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setExitOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-sm rounded-3xl p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
                <X size={22} />
              </div>
              <h3 className="font-display text-lg font-bold">Exit exam?</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your progress will be lost. The exam is available anytime since it is unlocked.
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  onClick={() => setExitOpen(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Keep going
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white cursor-pointer"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 z-[96] hidden md:block">
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-400">
          <CircleDot size={12} className="text-purple-400" /> {answeredCount}/{total} answered
        </span>
      </div>
    </motion.div>
  )
}

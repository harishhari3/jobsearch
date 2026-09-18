import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  X, ShieldCheck, Lock, CreditCard, Smartphone, Landmark, CheckCircle2,
  Loader2, Sparkles, BadgeCheck,
} from 'lucide-react'
import { EXAM_META } from '../data/assessment'
import {
  createOrder, loadRazorpay, verifySignature, storePaymentRecord,
  getRazorpayKeys, hasRazorpayKeys,
} from '../services/payment'
import { getToken } from '../services/auth'

const PROCESSING_STEPS = [
  'Contacting bank…',
  'Verifying transaction…',
  'Processing payment…',
]

const UPI_APPS = ['GPay', 'PhonePe', 'Paytm', 'BHIM']

const BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak', 'Punjab National Bank']

function formatCardNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

function formatUpi(v) {
  return v.replace(/[^a-zA-Z0-9.@_]/g, '').slice(0, 40)
}

export default function PaymentModal({ open, onClose, onSuccess }) {
  const [method, setMethod] = useState('card')
  const [phase, setPhase] = useState('form')
  const [stepIndex, setStepIndex] = useState(0)
  const [paymentId, setPaymentId] = useState('')
  const [paymentVerified, setPaymentVerified] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [upiApp, setUpiApp] = useState('GPay')
  const [bank, setBank] = useState('')

  const [errors, setErrors] = useState({})

  const reset = () => {
    setMethod('card')
    setPhase('form')
    setStepIndex(0)
    setPaymentId('')
    setPaymentVerified(true)
    setErrorMsg(null)
    setCardNumber('')
    setCardName('')
    setExpiry('')
    setCvv('')
    setUpiId('')
    setUpiApp('GPay')
    setBank('')
    setErrors({})
  }

  const close = () => {
    reset()
    onClose()
  }

  const validate = () => {
    const e = {}
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 12) e.cardNumber = 'Enter a valid card number'
      if (cardName.trim().length < 3) e.cardName = 'Enter the name on the card'
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        e.expiry = 'Use MM/YY format'
      } else {
        const [mm, yy] = expiry.split('/').map(Number)
        const now = new Date()
        const exp = new Date(2000 + yy, mm, 0)
        if (mm < 1 || mm > 12 || exp < new Date(now.getFullYear(), now.getMonth(), 0)) e.expiry = 'Card has expired'
      }
      if (!/^\d{3,4}$/.test(cvv)) e.cvv = '3–4 digits'
    }
    if (method === 'upi') {
      if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/.test(upiId)) e.upiId = 'Enter a valid UPI ID (e.g. name@bank)'
    }
    if (method === 'bank' && !bank) e.bank = 'Select a bank'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const pay = async () => {
    if (!validate()) return
    setErrorMsg(null)

    if (hasRazorpayKeys()) {
      setPhase('creating')
      try {
        const order = await createOrder(EXAM_META.price, 'INR', `exam_${Date.now()}`)
        const Razorpay = await loadRazorpay()
        const { keyId, keySecret } = getRazorpayKeys()
        setPhase('processing')

        const rzp = new Razorpay({
          key: keyId,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: 'JobPulse',
          description: 'Skill Exam — 3 DSA + 15 Aptitude',
          theme: { color: '#7c3aed', backdrop_color: '#0a0a13' },
          modal: {
            ondismiss: () => {
              setPhase('form')
              setErrorMsg('Payment window closed. No charge was made.')
            },
          },
          prefill: { name: cardName || 'Job Seeker', email: 'seeker@example.com' },
          notes: { product: 'jobpulse_skill_exam' },
          handler: async (response) => {
            const verified = await verifySignature(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              keySecret,
            )
            storePaymentRecord({
              provider: 'razorpay',
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              verified,
              amount: EXAM_META.price,
              currency: 'INR',
              paidAt: new Date().toISOString(),
            })
            setPaymentVerified(verified)
            setPaymentId(response.razorpay_payment_id)
            if (!verified) {
              setErrorMsg('Payment signature could not be verified. Contact support with your payment ID.')
            }
            setPhase('success')
          },
        })
        rzp.open()
      } catch (err) {
        setPhase('form')
        if (err.message === 'invalid_keys') setErrorMsg('Razorpay test keys are invalid or missing. Add valid keys in jobfinder/.env and restart the server.')
        else if (err.message === 'script_failed') setErrorMsg('Could not load the Razorpay checkout. Check your connection and try again.')
        else setErrorMsg('Could not create the payment order. Please try again.')
      }
    } else if (getToken()) {
      setPhase('creating')
      try {
        const order = await createOrder(EXAM_META.price, 'INR', `exam_${Date.now()}`)
        setPhase('processing')
        await new Promise((resolve) => setTimeout(resolve, 1200))
        const paymentId = `mock_pay_${Date.now()}`
        const verified = await verifySignature(order.id, paymentId, 'mock_signature')
        storePaymentRecord({
          provider: order.mock ? 'mock-backend' : 'backend',
          orderId: order.id,
          paymentId,
          signature: 'mock_signature',
          verified,
          amount: EXAM_META.price,
          currency: 'INR',
          paidAt: new Date().toISOString(),
        })
        setPaymentVerified(verified)
        setPaymentId(paymentId)
        if (!verified) {
          setErrorMsg('Payment could not be verified on the server.')
        }
        setPhase('success')
      } catch {
        setPhase('form')
        setErrorMsg('Could not process payment. Please try again.')
      }
    } else {
      setPhase('processing')
      setStepIndex(0)
      let i = 0
      const iv = setInterval(() => {
        i += 1
        if (i < PROCESSING_STEPS.length) {
          setStepIndex(i)
        } else {
          clearInterval(iv)
          const txn = `MOCK${Date.now().toString().slice(-7)}`
          storePaymentRecord({
            provider: 'mock',
            paymentId: txn,
            verified: true,
            amount: EXAM_META.price,
            currency: 'INR',
            paidAt: new Date().toISOString(),
          })
          setPaymentVerified(true)
          setPaymentId(txn)
          setPhase('success')
        }
      }, 850)
    }
  }

  const inputCls = (err) =>
    `w-full rounded-xl border bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-purple-400/60 ${
      err ? 'border-red-500/50' : 'border-white/10'
    }`

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => phase === 'form' && close()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-md overflow-hidden rounded-3xl shadow-2xl shadow-purple-950/40"
          >
            {(phase === 'creating' || phase === 'processing') && (
              <div className="flex flex-col items-center px-8 py-14">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600"
                >
                  <Loader2 size={26} className="text-white" />
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phase === 'creating' ? 'creating' : stepIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-sm font-medium text-slate-200"
                  >
                    {phase === 'creating' ? 'Creating secure payment order…' : PROCESSING_STEPS[stepIndex]}
                  </motion.p>
                </AnimatePresence>
                {phase === 'processing' && (
                  <div className="mt-5 h-1 w-48 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                      initial={{ width: '5%' }}
                      animate={{ width: `${((stepIndex + 1) / PROCESSING_STEPS.length) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                )}
              </div>
            )}

            {phase === 'success' && (
              <div className="flex flex-col items-center px-8 py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                  className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 12 }}
                  >
                    <CheckCircle2 size={44} className="text-emerald-400" />
                  </motion.div>
                </motion.div>
                <h3 className="font-display text-2xl font-bold">Payment Successful</h3>
                <p className="mt-2 text-sm text-slate-400">Your skill exam is now unlocked.</p>
                <div className="mt-3 flex flex-col items-center gap-1.5">
                  <span className="rounded-lg bg-white/5 px-3 py-1 font-mono text-sm text-purple-300">{paymentId}</span>
                  {paymentVerified ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                      <BadgeCheck size={12} /> Payment verified
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-300">Signature unverified — keep your payment ID</span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onSuccess}
                  className="mt-7 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-3.5 font-semibold text-white btn-glow cursor-pointer"
                >
                  <Sparkles size={17} />
                  Start Exam Now
                </motion.button>
              </div>
            )}

            {phase === 'form' && (
              <>
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">JobPulse Secure Checkout</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        {hasRazorpayKeys() ? (
                          <>
                            <Lock size={10} /> Razorpay Test Mode
                          </>
                        ) : (
                          <>
                            <Lock size={10} /> Mock checkout
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer" aria-label="Close">
                    <X size={17} />
                  </button>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-3">
                  <div>
                    <div className="text-xs text-slate-400">Skill Exam — one-time access</div>
                    <div className="text-[11px] text-slate-500">3 DSA + 15 Aptitude · 30 min · lifetime retakes</div>
                  </div>
                  <div className="font-display text-xl font-bold gradient-text">{EXAM_META.currency}{EXAM_META.price}</div>
                </div>

                <div className="px-6 py-5">
                  <div className="mb-4 flex gap-1.5 rounded-2xl bg-white/5 p-1.5">
                    {[
                      { id: 'card', icon: CreditCard, label: 'Card' },
                      { id: 'upi', icon: Smartphone, label: 'UPI' },
                      { id: 'bank', icon: Landmark, label: 'Net Banking' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-all cursor-pointer ${
                          method === m.id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-600/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <m.icon size={15} /> {m.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={method}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      {method === 'card' && (
                        <>
                          <div>
                            <input
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              placeholder="Card number"
                              inputMode="numeric"
                              className={inputCls(errors.cardNumber)}
                            />
                            {errors.cardNumber && <p className="mt-1 text-[11px] text-red-400">{errors.cardNumber}</p>}
                          </div>
                          <div>
                            <input
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="Name on card"
                              className={inputCls(errors.cardName)}
                            />
                            {errors.cardName && <p className="mt-1 text-[11px] text-red-400">{errors.cardName}</p>}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <input
                                value={expiry}
                                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                placeholder="MM/YY"
                                inputMode="numeric"
                                className={inputCls(errors.expiry)}
                              />
                              {errors.expiry && <p className="mt-1 text-[11px] text-red-400">{errors.expiry}</p>}
                            </div>
                            <div>
                              <input
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="CVV"
                                type="password"
                                inputMode="numeric"
                                className={inputCls(errors.cvv)}
                              />
                              {errors.cvv && <p className="mt-1 text-[11px] text-red-400">{errors.cvv}</p>}
                            </div>
                          </div>
                          <p className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-[11px] text-cyan-300">
                            Razorpay test cards: 4111 1111 1111 1111 (success) or 4000 0000 0000 0002 (declined). Any future expiry.
                          </p>
                        </>
                      )}

                      {method === 'upi' && (
                        <>
                          <div>
                            <input
                              value={upiId}
                              onChange={(e) => setUpiId(formatUpi(e.target.value))}
                              placeholder="yourname@upi"
                              className={inputCls(errors.upiId)}
                            />
                            {errors.upiId && <p className="mt-1 text-[11px] text-red-400">{errors.upiId}</p>}
                          </div>
                          <div>
                            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-500">Choose UPI app</div>
                            <div className="flex flex-wrap gap-2">
                              {UPI_APPS.map((app) => (
                                <button
                                  key={app}
                                  type="button"
                                  onClick={() => setUpiApp(app)}
                                  className={`rounded-xl border px-3 py-1.5 text-xs transition-all cursor-pointer ${
                                    upiApp === app
                                      ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {app}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {method === 'bank' && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {BANKS.map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setBank(b)}
                                className={`rounded-xl border px-3 py-2.5 text-xs text-left transition-all cursor-pointer ${
                                  bank === b
                                    ? 'border-purple-500/50 bg-purple-500/15 text-white'
                                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                          {errors.bank && <p className="text-[11px] text-red-400">{errors.bank}</p>}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {errorMsg && (
                    <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
                      {errorMsg}
                    </p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={pay}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3.5 font-semibold text-white btn-glow cursor-pointer"
                  >
                    <Lock size={15} />
                    {hasRazorpayKeys() ? `Pay ${EXAM_META.currency}${EXAM_META.price} with Razorpay` : `Pay ${EXAM_META.currency}${EXAM_META.price} securely`}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

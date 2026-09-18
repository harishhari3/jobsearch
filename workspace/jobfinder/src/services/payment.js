import { getToken, fetchWithAuth } from './auth'

const RZP_BASE = '/rzp'
const PAYMENT_RECORD_KEY = 'jobpulse_payment_record'
const EXAM_UNLOCK_KEY = 'jobpulse_exam_unlocked'

export function getRazorpayKeys() {
  return {
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
    keySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '',
  }
}

export function hasRazorpayKeys() {
  const { keyId, keySecret } = getRazorpayKeys()
  return Boolean(keyId && keySecret && !keyId.includes('placeholder'))
}

export async function createOrder(amount, currency = 'INR', receipt) {
  if (getToken()) {
    const res = await fetchWithAuth('/payments/order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, receipt }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'order_failed')
    }
    return res.json()
  }

  const body = new URLSearchParams({
    amount: String(Math.round(amount * 100)),
    currency,
    receipt: receipt || `exam_${Date.now()}`,
    notes: JSON.stringify({ product: 'jobpulse_skill_exam' }),
  })
  const res = await fetch(`${RZP_BASE}/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    if (res.status === 401) throw new Error('invalid_keys')
    throw new Error(text || 'order_failed')
  }
  return res.json()
}

export function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay)
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay))
      existing.addEventListener('error', () => reject(new Error('script_failed')))
      return
    }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve(window.Razorpay)
    s.onerror = () => reject(new Error('script_failed'))
    document.head.appendChild(s)
  })
}

export async function verifySignature(orderId, paymentId, signature, secret) {
  if (getToken()) {
    try {
      const res = await fetchWithAuth('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({ orderId, paymentId, signature }),
      })
      if (!res.ok) return false
      const data = await res.json()
      return Boolean(data.verified)
    } catch {
      return false
    }
  }

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}|${paymentId}`))
    const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
    return hex === signature
  } catch {
    return false
  }
}

export function storePaymentRecord(record) {
  localStorage.setItem(PAYMENT_RECORD_KEY, JSON.stringify(record))
  localStorage.setItem(EXAM_UNLOCK_KEY, '1')
}

export function getPaymentRecord() {
  try {
    return JSON.parse(localStorage.getItem(PAYMENT_RECORD_KEY)) || null
  } catch {
    return null
  }
}

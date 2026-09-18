const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'
const TOKEN_KEY = 'jobpulse_jwt_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export async function fetchWithAuth(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  })
  if (res.status === 401) {
    setToken(null)
  }
  return res
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Registration failed')
  }
  const data = await res.json()
  setToken(data.token)
  return data.user
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Login failed')
  }
  const data = await res.json()
  setToken(data.token)
  return data.user
}

export async function loginWithGoogle(idToken) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: idToken }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Google login failed')
  }
  const data = await res.json()
  setToken(data.token)
  return data.user
}

export async function getProfile() {
  const res = await fetchWithAuth('/users/me')
  if (!res.ok) {
    throw new Error('Failed to retrieve profile')
  }
  return res.json()
}

export function logout() {
  setToken(null)
}

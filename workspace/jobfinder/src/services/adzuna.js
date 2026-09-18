const ADZUNA_PROXY_BASE = '/jobs-api/v1/api/jobs'
const BACKEND_JOBS_BASE = `${import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'}/jobs`

const STORAGE_ID = 'jobpulse_adzuna_app_id'
const STORAGE_KEY = 'jobpulse_adzuna_app_key'

export function getCredentials() {
  return {
    appId: localStorage.getItem(STORAGE_ID) || import.meta.env.VITE_ADZUNA_APP_ID || '',
    appKey: localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_ADZUNA_APP_KEY || '',
  }
}

export function saveCredentials(appId, appKey) {
  if (appId) localStorage.setItem(STORAGE_ID, appId)
  else localStorage.removeItem(STORAGE_ID)
  if (appKey) localStorage.setItem(STORAGE_KEY, appKey)
  else localStorage.removeItem(STORAGE_KEY)
}

export function hasCredentials() {
  const { appId, appKey } = getCredentials()
  return Boolean(appId && appKey)
}

function buildParams({ what, where, category, salaryMin, salaryMax, contract, page, resultsPerPage = 20, sortBy }) {
  const params = new URLSearchParams()
  if (what) params.set('what', what)
  if (where) params.set('where', where)
  if (category) params.set('category', category)
  if (salaryMin) params.set('salary_min', salaryMin)
  if (salaryMax) params.set('salary_max', salaryMax)
  if (contract) params.set(contract, '1')
  if (sortBy) params.set('sort_by', sortBy)
  params.set('results_per_page', String(resultsPerPage))
  params.set('content-type', 'application/json')
  return params
}

export class AdzunaError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'AdzunaError'
    this.status = status
  }
}

function resolveJobsBase() {
  const { appId, appKey } = getCredentials()
  if (appId && appKey) {
    return { base: ADZUNA_PROXY_BASE, includeCredentials: true }
  }
  return { base: BACKEND_JOBS_BASE, includeCredentials: false }
}

export async function searchJobs({ country, ...filters }) {
  const { base, includeCredentials } = resolveJobsBase()
  const { appId, appKey } = getCredentials()

  const page = filters.page || 1
  const params = buildParams({ ...filters, page })
  if (includeCredentials) {
    params.set('app_id', appId)
    params.set('app_key', appKey)
  }

  const url = `${base}/${country}/search/${page}?${params.toString()}`
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new AdzunaError('network', 0)
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new AdzunaError('invalid_credentials', res.status)
    }
    if (res.status === 404) {
      throw new AdzunaError('not_found', res.status)
    }
    if (res.status === 503) {
      throw new AdzunaError('missing_credentials', res.status)
    }
    throw new AdzunaError('server', res.status)
  }

  const data = await res.json()
  return {
    count: data.count ?? 0,
    mean: data.mean ?? null,
    results: data.results ?? [],
  }
}

export async function fetchCategories(country) {
  const { base, includeCredentials } = resolveJobsBase()
  const { appId, appKey } = getCredentials()

  try {
    const params = new URLSearchParams()
    if (includeCredentials) {
      params.set('app_id', appId)
      params.set('app_key', appKey)
    }
    params.set('content-type', 'application/json')

    const res = await fetch(`${base}/${country}/categories?${params.toString()}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).slice(0, 12).map((c) => ({
      tag: c.tag,
      label: c.label,
    }))
  } catch {
    return []
  }
}

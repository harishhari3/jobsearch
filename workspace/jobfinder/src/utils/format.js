export function formatSalary(min, max, predicted) {
  if (min == null && max == null) {
    return predicted ? 'Salary undisclosed' : 'Not specified'
  }
  const fmt = (v) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v)

  if (min && max) {
    return `${fmt(min)} – ${fmt(max)}`
  }
  if (min) return `From ${fmt(min)}`
  if (max) return `Up to ${fmt(max)}`
  return 'Not specified'
}

export function formatSalaryShort(min, max) {
  if (min == null && max == null) return null
  const fmt = (v) =>
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(v)
  if (min && max) return `${fmt(min)}–${fmt(max)}`
  if (min) return `${fmt(min)}+`
  if (max) return `≤ ${fmt(max)}`
  return null
}

export function timeAgo(dateString) {
  const created = new Date(dateString)
  if (Number.isNaN(created.getTime())) return 'Recently'
  const seconds = Math.floor((Date.now() - created.getTime()) / 1000)
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
    }
  }
  return 'Just now'
}

export function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return div.textContent || ''
}

export function truncate(text, length = 160) {
  if (!text) return ''
  const clean = stripHtml(text)
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean
}

export function initials(name) {
  const parts = (name || '?').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

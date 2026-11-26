const API_BASE = (import.meta.env.VITE_API_BASE || 'https://mbg.habibdev.site').replace(/\/+$/, '')

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getHealth: async () => {
    const t0 = performance.now()
    const data = await request('/api/health')
    const latencyMs = Math.max(1, Math.round(performance.now() - t0))
    return { ...data, latencyMs }
  },
  getSummary: (days = 0) => request(`/api/summary?days=${days}`),
  getTrend: (days = 30) => request(`/api/trend?days=${days}`),
  getTopWords: (limit = 15) => request(`/api/top-words?limit=${limit}`),
  getComments: ({ q = '', sentiment = '', sort = 'd', days = 0, page = 1, pageSize = 8 }) => {
    const params = new URLSearchParams({
      q,
      sentiment,
      sort,
      days: String(days),
      page: String(page),
      page_size: String(pageSize),
    })
    return request(`/api/comments?${params.toString()}`)
  },
  getRandomComment: () => request('/api/random-comments?limit=1'),
  getModelMetrics: () => request('/api/model-metrics'),
  predictSingle: (text) =>
    request('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }),
  predictBatch: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return request('/api/predict-batch', {
      method: 'POST',
      body: formData,
    })
  },
}

export const fmtNumber = (n) => Number(n || 0).toLocaleString('id-ID')
export const fmtPct = (x) => `${Number(x || 0).toFixed(1).replace('.', ',')}%`

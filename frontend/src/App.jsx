import { useEffect, useState } from 'react'
import { Activity, Wifi, WifiOff } from 'lucide-react'
import { api } from './api'
import KpiSection from './components/KpiSection'
import TrendChart from './components/TrendChart'
import TopWordsSection from './components/TopWordsSection'
import LivePredictCard from './components/LivePredictCard'
import ModelMetricsCard from './components/ModelMetricsCard'
import CommentsTable from './components/CommentsTable'

const RANGES = [
  { label: '7 hari', value: 7 },
  { label: '14 hari', value: 14 },
  { label: '30 hari', value: 30 },
  { label: 'Semua Data', value: 0 },
]

export default function App() {
  const [days, setDays] = useState(0)
  const [connected, setConnected] = useState(null)
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [topWords, setTopWords] = useState({})
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([api.getSummary(days), api.getTrend(days || 30)])
      .then(([sumData, trendData]) => {
        if (!active) return
        setSummary(sumData)
        setTrend(trendData.series || [])
        setConnected(true)
      })
      .catch(() => {
        if (active) setConnected(false)
      })
    return () => {
      active = false
    }
  }, [days])

  useEffect(() => {
    api.getTopWords(15).then(setTopWords).catch(() => {})
    api.getModelMetrics().then(setMetrics).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-xl bg-indigo-600 p-2 text-white">
                <Activity className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Dashboard Sentimen Publik — Program MBG
              </h1>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Pure FastText Subword Embedding + BiLSTM (Dual Global Pooling)</span>
              <span>·</span>
              {connected === true ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                  <Wifi className="h-3 w-3" /> FastAPI Terhubung
                </span>
              ) : connected === false ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 font-semibold text-rose-700">
                  <WifiOff className="h-3 w-3" /> FastAPI Offline (jalankan python app.py)
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-500">
                  Menghubungkan ke FastAPI...
                </span>
              )}
            </div>
          </div>

          <div className="inline-flex self-start rounded-xl border border-slate-200 bg-slate-100 p-1 sm:self-auto">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setDays(r.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  days === r.value
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <KpiSection summary={summary} days={days} />
        <TrendChart series={trend} />
        <TopWordsSection topWords={topWords} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <LivePredictCard />
          <ModelMetricsCard metrics={metrics} />
        </div>

        <CommentsTable days={days} />
      </main>
    </div>
  )
}

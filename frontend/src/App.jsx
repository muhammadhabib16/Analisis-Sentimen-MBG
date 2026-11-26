import { useEffect, useState } from 'react'
import { BarChart3, MessageSquareText, SlidersHorizontal, FlaskConical } from 'lucide-react'
import { api } from './api'
import KpiSection from './components/KpiSection'
import TrendChart from './components/TrendChart'
import TopWordsSection from './components/TopWordsSection'
import LivePredictCard from './components/LivePredictCard'
import ModelMetricsCard from './components/ModelMetricsCard'
import CommentsTable from './components/CommentsTable'

const RANGES = [
  { label: '7H', full: '7 hari', value: 7 },
  { label: '14H', full: '14 hari', value: 14 },
  { label: '30H', full: '30 hari', value: 30 },
  { label: 'Semua', full: 'Semua data', value: 0 },
]

const NAV_ITEMS = [
  { id: 'overview', label: 'Ringkasan', icon: BarChart3 },
  { id: 'predict', label: 'Uji Model', icon: FlaskConical },
  { id: 'comments', label: 'Arsip Komentar', icon: MessageSquareText },
  { id: 'metrics', label: 'Evaluasi Model', icon: SlidersHorizontal },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
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

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab)

  return (
    <div className="flex min-h-screen bg-[#F7F7F5] text-zinc-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-zinc-200 bg-white md:flex">
        <div>
          <div className="border-b border-zinc-200 px-5 py-5">
            <div className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">
              Analitik Kebijakan
            </div>
            <div className="mt-1 text-base font-bold tracking-tight text-zinc-950">
              Sentimen MBG
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">FastText + BiLSTM</div>
          </div>

          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition ${
                    active
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-200 p-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected === true
                  ? 'bg-emerald-600'
                  : connected === false
                    ? 'bg-rose-600'
                    : 'bg-zinc-300'
              }`}
            />
            <span className="font-medium text-zinc-700">
              {connected === true
                ? 'API Terhubung'
                : connected === false
                  ? 'API Tidak Terjangkau'
                  : 'Menghubungkan...'}
            </span>
          </div>
          <p className="mt-1 text-zinc-400">Kelompok 14 · ML Kelas B</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-base font-semibold tracking-tight text-zinc-950">
                {currentNav?.label} — Opini Publik Program MBG
              </h1>
              <p className="text-xs text-zinc-500">
                Pemantauan sentimen masyarakat berbasis Pure FastText Skip-Gram &amp; BiLSTM
              </p>
            </div>

            {(activeTab === 'overview' || activeTab === 'comments') && (
              <div className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    title={r.full}
                    onClick={() => setDays(r.value)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      days === r.value
                        ? 'bg-white text-zinc-950 shadow-2xs ring-1 ring-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Nav Tabs */}
          <div className="flex gap-1 overflow-x-auto border-t border-zinc-200 px-4 py-2 md:hidden">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
                  activeTab === id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <>
              <KpiSection summary={summary} days={days} />
              <TrendChart series={trend} />
              <TopWordsSection topWords={topWords} />
            </>
          )}

          {activeTab === 'predict' && <LivePredictCard />}
          {activeTab === 'comments' && <CommentsTable days={days} />}
          {activeTab === 'metrics' && <ModelMetricsCard metrics={metrics} />}
        </main>
      </div>
    </div>
  )
}

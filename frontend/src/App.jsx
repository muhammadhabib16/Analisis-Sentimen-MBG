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
  { label: '7H', full: '7 hari terakhir', value: 7 },
  { label: '14H', full: '14 hari terakhir', value: 14 },
  { label: '30H', full: '30 hari terakhir', value: 30 },
  { label: 'Semua', full: 'Seluruh data', value: 0 },
]

const NAV_ITEMS = [
  { id: 'overview', label: 'Ringkasan', icon: BarChart3 },
  { id: 'predict', label: 'Uji Model', icon: FlaskConical },
  { id: 'comments', label: 'Arsip Komentar', icon: MessageSquareText },
  { id: 'metrics', label: 'Evaluasi Model', icon: SlidersHorizontal },
]

function getTelemetryDisplay(telemetry) {
  if (telemetry.state === 'operational') {
    return {
      statusText: 'Normal',
      dotClass: 'bg-[#3b8266]',
      meta: telemetry.latencyMs ? `${telemetry.latencyMs} ms` : 'Siap',
    }
  }
  if (telemetry.state === 'degraded') {
    return {
      statusText: 'Terbatas',
      dotClass: 'bg-[#b7791f]',
      meta: 'Parsial',
    }
  }
  if (telemetry.state === 'offline') {
    return {
      statusText: 'Tidak Aktif',
      dotClass: 'bg-[#c05664]',
      meta: 'Offline',
    }
  }
  return {
    statusText: 'Sinkronisasi',
    dotClass: 'bg-[#627d98]',
    meta: '...',
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [days, setDays] = useState(0)
  const [telemetry, setTelemetry] = useState({
    state: 'syncing',
    latencyMs: null,
    modelReady: false,
    dbReady: false,
  })
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [topWords, setTopWords] = useState({})
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    let active = true
    const checkHealth = () => {
      api
        .getHealth()
        .then((res) => {
          if (!active) return
          const fullReady = Boolean(res.model_loaded && res.db_exists)
          setTelemetry({
            state: fullReady ? 'operational' : 'degraded',
            latencyMs: res.latencyMs,
            modelReady: Boolean(res.model_loaded),
            dbReady: Boolean(res.db_exists),
          })
        })
        .catch(() => {
          if (!active) return
          setTelemetry({
            state: 'offline',
            latencyMs: null,
            modelReady: false,
            dbReady: false,
          })
        })
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let active = true
    const t0 = performance.now()
    Promise.all([api.getSummary(days), api.getTrend(days || 30)])
      .then(([sumData, trendData]) => {
        if (!active) return
        const elapsed = Math.max(1, Math.round(performance.now() - t0))
        setSummary(sumData)
        setTrend(trendData.series || [])
        setTelemetry((prev) =>
          prev.state === 'offline' || prev.state === 'syncing'
            ? { state: 'operational', latencyMs: elapsed, modelReady: true, dbReady: true }
            : prev,
        )
      })
      .catch(() => {
        if (active) {
          setTelemetry((prev) => ({ ...prev, state: 'offline' }))
        }
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
  const statusInfo = getTelemetryDisplay(telemetry)

  return (
    <div className="flex min-h-screen bg-[#f4f7fa] text-slate-800">
      {/* Desktop Sidebar — Soft Misty Slate-Blue */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-[#dae3ee] bg-[#ecf1f7] md:flex">
        <div>
          <div className="border-b border-[#dae3ee] px-5 py-5">
            <div className="text-[10px] font-semibold tracking-widest text-[#486581] uppercase">
              Analitik Kebijakan
            </div>
            <div className="mt-1 text-base font-semibold tracking-tight text-[#102a43]">
              Sentimen MBG
            </div>
            <div className="mt-0.5 text-[11px] text-[#627d98]">FastText · BiLSTM</div>
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
                      ? 'bg-white text-[#102a43] shadow-2xs ring-1 ring-[#d3dfec]'
                      : 'text-[#486581] hover:bg-white/55 hover:text-[#102a43]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-[#2b5b84]' : 'text-[#627d98]'}`} />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Quiet System Telemetry Reader */}
        <div className="border-t border-[#dae3ee] p-4">
          <div className="rounded-md border border-[#d5e0ec] bg-white/75 px-3 py-2.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#627d98]">Status Layanan</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#102a43]">
                <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.statusText}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between border-t border-[#e6edf5] pt-1.5 text-[10px] text-[#627d98]">
              <span>{telemetry.modelReady ? 'Engine BiLSTM' : 'Mode Siaga'}</span>
              <span className="font-mono tabular-nums">{statusInfo.meta}</span>
            </div>
          </div>
          <p className="mt-2.5 px-0.5 text-[11px] text-[#627d98]">Kelompok 14 · ML Kelas B</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[#dde5ef] bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[#102a43]">
                {currentNav?.label} — Opini Publik Program MBG
              </h1>
              <p className="text-xs text-[#627d98]">
                Pemantauan sentimen masyarakat berbasis Pure FastText Skip-Gram &amp; BiLSTM
              </p>
            </div>

            {(activeTab === 'overview' || activeTab === 'comments') && (
              <div className="inline-flex rounded-md border border-[#d8e2ee] bg-[#eef3f8] p-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    title={r.full}
                    onClick={() => setDays(r.value)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      days === r.value
                        ? 'bg-white text-[#102a43] shadow-2xs ring-1 ring-[#d3dfec]'
                        : 'text-[#627d98] hover:text-[#102a43]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Nav Tabs */}
          <div className="flex gap-1 overflow-x-auto border-t border-[#e2eaf2] bg-[#f4f7fa] px-4 py-2 md:hidden">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === id
                    ? 'bg-[#23486e] text-white'
                    : 'text-[#486581] hover:bg-[#e4ecf4]'
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

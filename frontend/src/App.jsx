import { useEffect, useState } from 'react'
import {
  BarChart3,
  MessageSquareText,
  SlidersHorizontal,
  FlaskConical,
  Activity,
  Cpu,
  Database,
  ShieldCheck,
  CalendarRange,
} from 'lucide-react'
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
  { label: 'Semua', full: 'Seluruh periode data', value: 0 },
]

const NAV_ITEMS = [
  { id: 'overview', label: 'Ringkasan Eksekutif', shortLabel: 'Ringkasan', icon: BarChart3 },
  { id: 'predict', label: 'Uji Sentimen Live', shortLabel: 'Uji Model', icon: FlaskConical },
  { id: 'comments', label: 'Arsip Komentar', shortLabel: 'Arsip', icon: MessageSquareText },
  { id: 'metrics', label: 'Evaluasi & Arsitektur', shortLabel: 'Evaluasi', icon: SlidersHorizontal },
]

function resolveTelemetryMeta(telemetry) {
  if (telemetry.state === 'operational') {
    return {
      label: 'Sistem Operasional',
      badge: `${telemetry.latencyMs} ms`,
      dot: 'bg-emerald-400',
      ping: 'bg-emerald-400',
      badgeClass: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
      headerPill: 'border-blue-200 bg-blue-50/80 text-blue-800',
      headerDot: 'bg-emerald-500',
    }
  }
  if (telemetry.state === 'degraded') {
    return {
      label: 'Mode Terbatas',
      badge: 'Partial',
      dot: 'bg-amber-400',
      ping: 'bg-amber-400',
      badgeClass: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
      headerPill: 'border-amber-200 bg-amber-50 text-amber-800',
      headerDot: 'bg-amber-500',
    }
  }
  if (telemetry.state === 'offline') {
    return {
      label: 'Layanan Offline',
      badge: 'Terputus',
      dot: 'bg-rose-500',
      ping: null,
      badgeClass: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
      headerPill: 'border-rose-200 bg-rose-50 text-rose-700',
      headerDot: 'bg-rose-500',
    }
  }
  return {
    label: 'Sinkronisasi Engine...',
    badge: 'Init',
    dot: 'bg-blue-400',
    ping: 'bg-blue-400',
    badgeClass: 'border-blue-500/25 bg-blue-500/10 text-blue-300',
    headerPill: 'border-slate-200 bg-slate-100 text-slate-600',
    headerDot: 'bg-blue-500',
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
  const statusMeta = resolveTelemetryMeta(telemetry)

  return (
    <div className="flex min-h-screen bg-slate-100/90 text-slate-900">
      {/* Desktop Sidebar — Deep Navy & Cobalt Accent */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-800/80 bg-gradient-to-b from-slate-950 via-[#0B1730] to-slate-950 text-slate-100 md:flex">
        <div>
          <div className="border-b border-slate-800/80 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-widest text-blue-400 uppercase">
                  Analitik Kebijakan
                </div>
                <div className="text-base font-bold tracking-tight text-white">Sentimen MBG</div>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
              Observatorium opini publik berbasis Pure FastText &amp; BiLSTM.
            </p>
          </div>

          <div className="px-3 pt-4 pb-2">
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
              Modul Navigasi
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-950/60 ring-1 ring-blue-500/50'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    {label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Professional Engine Telemetry Widget */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/85 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {statusMeta.ping && (
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${statusMeta.ping}`}
                    />
                  )}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${statusMeta.dot}`} />
                </span>
                <span className="text-[11px] font-semibold text-slate-100">{statusMeta.label}</span>
              </div>
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums ${statusMeta.badgeClass}`}
              >
                {statusMeta.badge}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-slate-800/90 pt-2.5 text-[10px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Cpu
                  className={`h-3 w-3 ${telemetry.modelReady ? 'text-blue-400' : 'text-slate-600'}`}
                />
                <span>{telemetry.modelReady ? 'BiLSTM Aktif' : 'Model Siaga'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Database
                  className={`h-3 w-3 ${telemetry.dbReady ? 'text-blue-400' : 'text-slate-600'}`}
                />
                <span>{telemetry.dbReady ? 'SQLite Indeks' : 'Basis Data'}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between px-0.5 text-[11px] text-slate-500">
            <span>Kelompok 14 · ML Kelas B</span>
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400/70" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Accent Strip + Sticky Header */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-500 to-sky-500" />
        <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 shadow-2xs backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-slate-950">
                  {currentNav?.label}
                </h1>
                <span className="hidden rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 sm:inline-flex">
                  Program Makan Bergizi Gratis
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Klasifikasi sentimen publik berbasis Pure FastText Skip-Gram &amp; Bidirectional LSTM
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Compact Telemetry Pill */}
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusMeta.headerPill}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.headerDot}`} />
                <span>{statusMeta.label}</span>
                {telemetry.latencyMs && (
                  <span className="font-mono text-[10px] opacity-80 tabular-nums">
                    · {telemetry.latencyMs}ms
                  </span>
                )}
              </div>

              {(activeTab === 'overview' || activeTab === 'comments') && (
                <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
                  <CalendarRange className="ml-2 hidden h-3.5 w-3.5 text-slate-400 sm:block" />
                  {RANGES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      title={r.full}
                      onClick={() => setDays(r.value)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        days === r.value
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Nav Tabs */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-slate-200 bg-slate-50/80 px-4 py-2 md:hidden">
            {NAV_ITEMS.map(({ id, shortLabel, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {shortLabel}
                </button>
              )
            })}
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

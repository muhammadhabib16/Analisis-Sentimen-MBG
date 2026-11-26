import { MessageSquareText, ThumbsUp, MinusCircle, AlertTriangle } from 'lucide-react'
import { fmtNumber, fmtPct } from '../api'

const SENTIMENT_META = [
  {
    key: 'Positif',
    label: 'Sentimen Positif',
    short: 'Positif',
    icon: ThumbsUp,
    borderTop: 'border-t-emerald-500',
    iconWrap: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    bar: 'bg-emerald-500',
  },
  {
    key: 'Netral',
    label: 'Sentimen Netral',
    short: 'Netral',
    icon: MinusCircle,
    borderTop: 'border-t-amber-500',
    iconWrap: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/70',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    bar: 'bg-amber-500',
  },
  {
    key: 'Negatif',
    label: 'Sentimen Negatif',
    short: 'Negatif',
    icon: AlertTriangle,
    borderTop: 'border-t-rose-500',
    iconWrap: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200/70',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    bar: 'bg-rose-500',
  },
]

export default function KpiSection({ summary, days }) {
  const total = summary?.total || 0
  const counts = summary?.counts || { Positif: 0, Netral: 0, Negatif: 0 }
  const pcts = summary?.percentages || { Positif: 0, Netral: 0, Negatif: 0 }

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hero Blue Metric Card */}
        <div className="relative overflow-hidden rounded-xl border border-blue-700/60 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-5 text-white shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-blue-200 uppercase">
                Total Opini Publik
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-white tabular-nums">
                {fmtNumber(total)}
              </div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-blue-100 ring-1 ring-white/20">
              <MessageSquareText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-xs text-blue-100/90">
            <span>{days > 0 ? `Rentang ${days} hari terakhir` : 'Seluruh korpus unik'}</span>
            <span className="font-mono text-[11px] text-blue-200">100%</span>
          </div>
        </div>

        {/* Sentiment Class Cards */}
        {SENTIMENT_META.map(({ key, label, short, icon: Icon, borderTop, iconWrap, badge }) => {
          const val = counts[key] || 0
          const pct = pcts[key] || 0
          return (
            <div
              key={key}
              className={`rounded-xl border border-slate-200/90 border-t-3 ${borderTop} bg-white p-5 shadow-2xs transition hover:border-slate-300`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    {label}
                  </span>
                  <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">
                    {fmtNumber(val)}
                  </div>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                <span className="text-slate-500">Proporsi kelas {short.toLowerCase()}</span>
                <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${badge}`}>
                  {fmtPct(pct)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Distribution Composition Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-2xs">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold tracking-wider text-blue-900 uppercase">
            Distribusi Proporsi Sentimen Opini
          </span>
          <span className="font-mono text-slate-600 tabular-nums">
            Positif {fmtPct(pcts.Positif)} · Netral {fmtPct(pcts.Netral)} · Negatif {fmtPct(pcts.Negatif)}
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/70">
          {SENTIMENT_META.map(({ key, bar }) => (
            <div
              key={key}
              title={`${key}: ${fmtNumber(counts[key])} (${fmtPct(pcts[key])})`}
              className={`${bar} transition-all duration-300`}
              style={{ width: `${pcts[key] || 0}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

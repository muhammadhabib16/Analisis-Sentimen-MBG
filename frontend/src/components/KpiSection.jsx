import { MessageSquare, ThumbsUp, MinusCircle, ThumbsDown } from 'lucide-react'
import { fmtNumber, fmtPct } from '../api'

const CARDS = [
  {
    key: 'Positif',
    label: 'Sentimen Positif',
    icon: ThumbsUp,
    ring: 'border-emerald-200 bg-emerald-50/50',
    iconBg: 'bg-emerald-100 text-emerald-700',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  {
    key: 'Netral',
    label: 'Sentimen Netral',
    icon: MinusCircle,
    ring: 'border-amber-200 bg-amber-50/50',
    iconBg: 'bg-amber-100 text-amber-700',
    bar: 'bg-amber-400',
    text: 'text-amber-700',
  },
  {
    key: 'Negatif',
    label: 'Sentimen Negatif',
    icon: ThumbsDown,
    ring: 'border-rose-200 bg-rose-50/50',
    iconBg: 'bg-rose-100 text-rose-700',
    bar: 'bg-rose-500',
    text: 'text-rose-700',
  },
]

export default function KpiSection({ summary, days }) {
  const total = summary?.total || 0
  const counts = summary?.counts || { Positif: 0, Netral: 0, Negatif: 0 }
  const pcts = summary?.percentages || { Positif: 0, Netral: 0, Negatif: 0 }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Komentar</span>
            <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <MessageSquare className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {fmtNumber(total)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {days > 0 ? `Komentar dalam ${days} hari terakhir` : 'Total komentar unik di database'}
          </p>
        </div>

        {CARDS.map(({ key, label, icon: Icon, ring, iconBg, bar, text }) => {
          const val = counts[key] || 0
          const pct = pcts[key] || 0
          return (
            <div key={key} className={`rounded-2xl border p-5 shadow-xs ${ring}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <span className={`rounded-xl p-2 ${iconBg}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {fmtNumber(val)}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/80">
                <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-500">Proporsi {key}</span>
                <span className={`font-semibold ${text}`}>{fmtPct(pct)}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Distribusi Proporsi Sentimen Keseluruhan</span>
          <span>Positif · Netral · Negatif</span>
        </div>
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            title={`Positif: ${fmtNumber(counts.Positif)} (${fmtPct(pcts.Positif)})`}
            className="bg-emerald-500 transition-all"
            style={{ width: `${pcts.Positif || 0}%` }}
          />
          <div
            title={`Netral: ${fmtNumber(counts.Netral)} (${fmtPct(pcts.Netral)})`}
            className="bg-amber-400 transition-all"
            style={{ width: `${pcts.Netral || 0}%` }}
          />
          <div
            title={`Negatif: ${fmtNumber(counts.Negatif)} (${fmtPct(pcts.Negatif)})`}
            className="bg-rose-500 transition-all"
            style={{ width: `${pcts.Negatif || 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}

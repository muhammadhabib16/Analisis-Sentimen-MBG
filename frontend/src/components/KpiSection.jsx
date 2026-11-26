import { fmtNumber, fmtPct } from '../api'

const SENTIMENT_META = [
  { key: 'Positif', label: 'Positif', dot: 'bg-emerald-600', bar: 'bg-emerald-600', text: 'text-emerald-700' },
  { key: 'Netral', label: 'Netral', dot: 'bg-amber-500', bar: 'bg-amber-500', text: 'text-amber-700' },
  { key: 'Negatif', label: 'Negatif', dot: 'bg-rose-600', bar: 'bg-rose-600', text: 'text-rose-700' },
]

export default function KpiSection({ summary, days }) {
  const total = summary?.total || 0
  const counts = summary?.counts || { Positif: 0, Netral: 0, Negatif: 0 }
  const pcts = summary?.percentages || { Positif: 0, Netral: 0, Negatif: 0 }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="grid grid-cols-1 divide-y divide-zinc-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <div className="p-5">
          <div className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            Total Komentar
          </div>
          <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums">
            {fmtNumber(total)}
          </div>
          <div className="mt-1.5 text-xs text-zinc-500">
            {days > 0 ? `Periode ${days} hari terakhir` : 'Seluruh data unik terindeks'}
          </div>
        </div>

        {SENTIMENT_META.map(({ key, label, dot, text }) => {
          const val = counts[key] || 0
          const pct = pcts[key] || 0
          return (
            <div key={key} className="p-5 sm:border-t sm:border-zinc-200 lg:border-t-0">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {label}
                </span>
                <span className={`font-mono text-xs font-semibold tabular-nums ${text}`}>
                  {fmtPct(pct)}
                </span>
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                {fmtNumber(val)}
              </div>
              <div className="mt-1.5 text-xs text-zinc-500">
                komentar terklasifikasi {label.toLowerCase()}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-zinc-200 bg-zinc-50/70 px-5 py-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="font-medium tracking-wider uppercase">Komposisi Sentimen</span>
          <span className="font-mono tabular-nums">
            Positif {fmtPct(pcts.Positif)} · Netral {fmtPct(pcts.Netral)} · Negatif {fmtPct(pcts.Negatif)}
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-sm bg-zinc-200">
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

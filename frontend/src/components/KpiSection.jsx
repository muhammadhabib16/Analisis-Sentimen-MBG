import { fmtNumber, fmtPct } from '../api'

const SENTIMENT_META = [
  { key: 'Positif', label: 'Positif', dot: 'bg-[#3b8266]', bar: 'bg-[#3b8266]', text: 'text-[#2f6f55]' },
  { key: 'Netral', label: 'Netral', dot: 'bg-[#829ab1]', bar: 'bg-[#9fb3c8]', text: 'text-[#486581]' },
  { key: 'Negatif', label: 'Negatif', dot: 'bg-[#c05664]', bar: 'bg-[#c05664]', text: 'text-[#a34250]' },
]

export default function KpiSection({ summary, days }) {
  const total = summary?.total || 0
  const counts = summary?.counts || { Positif: 0, Netral: 0, Negatif: 0 }
  const pcts = summary?.percentages || { Positif: 0, Netral: 0, Negatif: 0 }

  return (
    <div className="overflow-hidden rounded-lg border border-[#dce4ee] bg-white">
      <div className="grid grid-cols-1 divide-y divide-[#e4ebf3] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {/* Soft Ice-Blue Primary Column */}
        <div className="bg-[#f4f8fc] p-5">
          <div className="text-[11px] font-medium tracking-wider text-[#486581] uppercase">
            Total Komentar
          </div>
          <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[#102a43] tabular-nums">
            {fmtNumber(total)}
          </div>
          <div className="mt-1.5 text-xs text-[#627d98]">
            {days > 0 ? `Periode ${days} hari terakhir` : 'Seluruh data unik terindeks'}
          </div>
        </div>

        {SENTIMENT_META.map(({ key, label, dot, text }) => {
          const val = counts[key] || 0
          const pct = pcts[key] || 0
          return (
            <div key={key} className="p-5 sm:border-t sm:border-[#e4ebf3] lg:border-t-0">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wider text-[#627d98] uppercase">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {label}
                </span>
                <span className={`font-mono text-xs font-medium tabular-nums ${text}`}>
                  {fmtPct(pct)}
                </span>
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tracking-tight text-[#102a43] tabular-nums">
                {fmtNumber(val)}
              </div>
              <div className="mt-1.5 text-xs text-[#627d98]">
                komentar terklasifikasi {label.toLowerCase()}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-[#e4ebf3] bg-[#f8fafc] px-5 py-3">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#627d98]">
          <span className="font-medium tracking-wider uppercase">Komposisi Sentimen</span>
          <span className="font-mono tabular-nums">
            Positif {fmtPct(pcts.Positif)} · Netral {fmtPct(pcts.Netral)} · Negatif {fmtPct(pcts.Negatif)}
          </span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#e4ebf3]">
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

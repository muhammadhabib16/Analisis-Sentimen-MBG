import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function TrendChart({ series = [] }) {
  const chartData = series.map((item) => ({
    ...item,
    label: formatDateLabel(item.date),
  }))

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Dinamika Tren Sentimen Harian</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pergerakan volume opini publik per tanggal publikasi hasil klasifikasi BiLSTM.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-0.5 font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Positif
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/70 px-2.5 py-0.5 font-medium text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Netral
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/70 px-2.5 py-0.5 font-medium text-rose-800">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Negatif
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Data tren harian sedang dimuat atau belum tersedia.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPositif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNegatif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#f8fafc', padding: '1px 0' }}
                  labelStyle={{ color: '#93c5fd', marginBottom: '4px', fontSize: '11px', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="Positif"
                  stroke="#059669"
                  fill="url(#gradPositif)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="Netral"
                  stroke="#d97706"
                  fillOpacity={0}
                  strokeWidth={1.75}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="Negatif"
                  stroke="#e11d48"
                  fill="url(#gradNegatif)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  )
}

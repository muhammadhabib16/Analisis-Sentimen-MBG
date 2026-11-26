import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

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
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Dinamika Sentimen Harian</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Volume komentar per hari berdasarkan tanggal publikasi dan klasifikasi model BiLSTM.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 bg-emerald-600" /> Positif
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 border-t-2 border-dashed border-amber-500" /> Netral
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 bg-rose-600" /> Negatif
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              Data tren harian belum tersedia.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="#e4e4e7" />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: '#e4e4e7' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fafafa',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#fafafa', padding: '1px 0' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '4px', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="Positif"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="Netral"
                  stroke="#d97706"
                  strokeWidth={1.75}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="Negatif"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  )
}

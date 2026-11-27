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
    <section className="overflow-hidden rounded-lg border border-[#dce4ee] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4ebf3] bg-[#f8fafd] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[#102a43]">Dinamika Sentimen Harian</h2>
          <p className="mt-0.5 text-xs text-[#627d98]">
            Volume komentar per hari berdasarkan tanggal publikasi dan klasifikasi model BiLSTM.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#486581]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 bg-[#3b8266]" /> Positif
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 border-t-2 border-dashed border-[#829ab1]" /> Netral
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 bg-[#c05664]" /> Negatif
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-[#829ab1]">
              Data tren harian belum tersedia.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="#e6edf5" />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: '#d8e2ee' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#627d98' }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#627d98' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#102a43',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#f0f4f8',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#f0f4f8', padding: '1px 0' }}
                  labelStyle={{ color: '#9fb3c8', marginBottom: '4px', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="Positif"
                  stroke="#3b8266"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="Netral"
                  stroke="#829ab1"
                  strokeWidth={1.6}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="Negatif"
                  stroke="#c05664"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  )
}

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Perubahan Sentimen per Hari</h2>
        <p className="text-sm text-slate-500">
          Tren jumlah komentar harian menurut tanggal publikasi dan label prediksi model BiLSTM.
        </p>
      </div>

      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Data tren belum tersedia.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="Positif" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line
                type="monotone"
                dataKey="Netral"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="5 4"
                dot={{ r: 3 }}
              />
              <Line type="monotone" dataKey="Negatif" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

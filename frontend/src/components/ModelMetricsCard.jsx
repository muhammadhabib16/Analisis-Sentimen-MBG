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
import { fmtNumber, fmtPct } from '../api'

const CLASSES = ['Negatif', 'Netral', 'Positif']

const PILL = {
  Positif: 'bg-emerald-100 text-emerald-800',
  Netral: 'bg-amber-100 text-amber-800',
  Negatif: 'bg-rose-100 text-rose-800',
}

export default function ModelMetricsCard({ metrics }) {
  const cm = metrics?.confusion_matrix || [
    [434, 33, 43],
    [37, 190, 16],
    [57, 24, 287],
  ]
  const hist = metrics?.training_history || { accuracy: [], val_accuracy: [] }
  const reportRows = CLASSES.map((name, i) => {
    const support = cm[i].reduce((a, b) => a + b, 0)
    const predCol = cm.reduce((a, r) => a + r[i], 0)
    const precision = predCol ? cm[i][i] / predCol : 0
    const recall = support ? cm[i][i] / support : 0
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
    return { name, precision, recall, f1, support }
  })

  const totalSupport = reportRows.reduce((a, r) => a + r.support, 0)
  const testAcc = (metrics?.test_accuracy || 0) * 100
  const peakVal = hist.val_accuracy?.length ? Math.max(...hist.val_accuracy) * 100 : 0
  const maxCell = Math.max(1, ...cm.flat())

  const historyData = (hist.accuracy || []).map((acc, idx) => ({
    epoch: `E${idx + 1}`,
    Train: Number((acc * 100).toFixed(2)),
    Val: Number(((hist.val_accuracy?.[idx] || 0) * 100).toFixed(2)),
  }))

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Performa Model Pure FastText + BiLSTM</h2>
          <p className="text-sm text-slate-500">
            Evaluasi pada 10% Data Uji (Test Split) yang terisolasi tanpa kebocoran kamus.
          </p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-right">
          <div className="text-2xl font-extrabold text-indigo-700">{fmtPct(testAcc)}</div>
          <div className="text-[11px] font-medium text-indigo-600">
            {fmtNumber(totalSupport)} uji · Peak Val {fmtPct(peakVal)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-3 font-semibold">Kelas</th>
              <th className="py-2 px-2 text-right font-semibold">Precision</th>
              <th className="py-2 px-2 text-right font-semibold">Recall</th>
              <th className="py-2 px-2 text-right font-semibold">F1-Score</th>
              <th className="py-2 pl-2 text-right font-semibold">Support</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportRows.map((r) => (
              <tr key={r.name}>
                <td className="py-2 pr-3">
                  <span className={`rounded-full px-2.5 py-0.5 font-semibold ${PILL[r.name]}`}>
                    {r.name}
                  </span>
                </td>
                <td className="py-2 px-2 text-right font-mono">{r.precision.toFixed(4)}</td>
                <td className="py-2 px-2 text-right font-mono">{r.recall.toFixed(4)}</td>
                <td className="py-2 px-2 text-right font-mono font-semibold">{r.f1.toFixed(4)}</td>
                <td className="py-2 pl-2 text-right font-mono">{fmtNumber(r.support)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold text-slate-700">
          Confusion Matrix (Baris: Aktual · Kolom: Prediksi)
        </h3>
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
          <div />
          {CLASSES.map((c) => (
            <div key={c} className="font-semibold text-slate-500">
              {c}
            </div>
          ))}
          {cm.map((row, i) => (
            <div key={CLASSES[i]} className="contents">
              <div className="flex items-center justify-end pr-2 font-semibold text-slate-600">
                {CLASSES[i]}
              </div>
              {row.map((val, j) => {
                const alpha = 0.08 + (0.82 * val) / maxCell
                const dark = val / maxCell > 0.45
                return (
                  <div
                    key={`${i}-${j}`}
                    style={{ backgroundColor: `rgba(79, 70, 229, ${alpha.toFixed(2)})` }}
                    className={`rounded-lg py-2 font-mono font-bold ${
                      dark ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {val}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {historyData.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold text-slate-700">
            Kurva Akurasi Training vs Validation (%)
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Train" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line
                  type="monotone"
                  dataKey="Val"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <dl className="mt-5 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-500">Embedding</dt>
          <dd className="text-slate-800">Pure FastText Skip-Gram (sg=1, 128 dim, tanpa Lexicon Prior)</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Arsitektur</dt>
          <dd className="text-slate-800">SpatialDropout(0.20) → BiLSTM(128) → Dual Pool → Dense(64)</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Preprocessing NLP</dt>
          <dd className="text-slate-800">Normalisasi Slang &amp; Syntactic Negation Binding (tanpa kamus)</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Optimizer</dt>
          <dd className="text-slate-800">Adam (lr 0.001 + ReduceLROnPlateau), Batch 32</dd>
        </div>
      </dl>
    </section>
  )
}

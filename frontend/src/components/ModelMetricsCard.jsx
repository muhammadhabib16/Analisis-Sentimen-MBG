import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { fmtNumber, fmtPct } from '../api'

const CLASSES = ['Negatif', 'Netral', 'Positif']

const DOT = {
  Positif: 'bg-emerald-600',
  Netral: 'bg-amber-500',
  Negatif: 'bg-rose-600',
}

export default function ModelMetricsCard({ metrics }) {
  const cm = metrics?.confusion_matrix || [
    [446, 23, 41],
    [46, 184, 13],
    [61, 14, 293],
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
  const macroF1 = (metrics?.classification_report?.['macro avg']?.['f1-score'] || 0) * 100
  const peakVal = hist.val_accuracy?.length ? Math.max(...hist.val_accuracy) * 100 : 0
  const maxCell = Math.max(1, ...cm.flat())

  const historyData = (hist.accuracy || []).map((acc, idx) => ({
    epoch: `E${idx + 1}`,
    Train: Number((acc * 100).toFixed(2)),
    Val: Number(((hist.val_accuracy?.[idx] || 0) * 100).toFixed(2)),
  }))

  return (
    <div className="space-y-5">
      {/* Executive Metric Strip */}
      <div className="grid grid-cols-1 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <div className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            Test Accuracy
          </div>
          <div className="mt-1.5 font-mono text-3xl font-semibold text-zinc-950 tabular-nums">
            {fmtPct(testAcc)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Pada {fmtNumber(totalSupport)} sampel uji terisolasi (10%)
          </div>
        </div>
        <div className="p-5">
          <div className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            Macro F1-Score
          </div>
          <div className="mt-1.5 font-mono text-3xl font-semibold text-zinc-950 tabular-nums">
            {fmtPct(macroF1)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Rata-rata seimbang seluruh 3 kelas</div>
        </div>
        <div className="p-5">
          <div className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            Peak Validation Accuracy
          </div>
          <div className="mt-1.5 font-mono text-3xl font-semibold text-zinc-950 tabular-nums">
            {fmtPct(peakVal)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            EarlyStopping ({historyData.length || 0} epoch dijalankan)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Classification Report & Confusion Matrix */}
        <section className="rounded-lg border border-zinc-200 bg-white lg:col-span-7">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-950">Classification Report &amp; Confusion Matrix</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Model Pure FastText Skip-Gram + BiLSTM (Dual Global Pooling) tanpa Lexicon Prior.
            </p>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-[11px] text-zinc-500 uppercase">
                    <th className="py-2 pr-3 font-medium">Kelas</th>
                    <th className="py-2 px-2 text-right font-medium">Precision</th>
                    <th className="py-2 px-2 text-right font-medium">Recall</th>
                    <th className="py-2 px-2 text-right font-medium">F1-Score</th>
                    <th className="py-2 pl-2 text-right font-medium">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono tabular-nums">
                  {reportRows.map((r) => (
                    <tr key={r.name}>
                      <td className="py-2.5 pr-3 font-sans">
                        <span className="inline-flex items-center gap-2 font-medium text-zinc-900">
                          <span className={`h-2 w-2 rounded-full ${DOT[r.name]}`} />
                          {r.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-zinc-700">{r.precision.toFixed(4)}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-700">{r.recall.toFixed(4)}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-zinc-950">
                        {r.f1.toFixed(4)}
                      </td>
                      <td className="py-2.5 pl-2 text-right text-zinc-500">{fmtNumber(r.support)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 border-t border-zinc-200 pt-5">
              <div className="mb-3 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
                Confusion Matrix (Baris: Aktual · Kolom: Prediksi)
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                <div />
                {CLASSES.map((c) => (
                  <div key={c} className="pb-1 text-[11px] font-medium text-zinc-500">
                    {c}
                  </div>
                ))}
                {cm.map((row, i) => (
                  <div key={CLASSES[i]} className="contents">
                    <div className="flex items-center justify-end pr-2 text-[11px] font-medium text-zinc-600">
                      {CLASSES[i]}
                    </div>
                    {row.map((val, j) => {
                      const ratio = val / maxCell
                      const alpha = 0.06 + 0.84 * ratio
                      const dark = ratio > 0.45
                      return (
                        <div
                          key={`${i}-${j}`}
                          style={{ backgroundColor: `rgba(24, 24, 27, ${alpha.toFixed(2)})` }}
                          className={`rounded py-2.5 font-mono font-semibold tabular-nums ${
                            dark ? 'text-white' : 'text-zinc-800'
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
          </div>
        </section>

        {/* Training Curve & Architecture Spec */}
        <section className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white lg:col-span-5">
          <div>
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-zinc-950">Kurva Pelatihan &amp; Spesifikasi</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Akurasi Training vs Validation per epoch (%).
              </p>
            </div>

            <div className="p-5">
              {historyData.length > 0 && (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis dataKey="epoch" axisLine={{ stroke: '#e4e4e7' }} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                      <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                      <Tooltip
                        formatter={(v) => `${v}%`}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fafafa',
                          fontSize: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="Train" stroke="#18181b" strokeWidth={2} dot={{ r: 2.5 }} />
                      <Line
                        type="monotone"
                        dataKey="Val"
                        stroke="#dc2626"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 2.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <dl className="mt-5 space-y-2.5 border-t border-zinc-200 pt-4 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Embedding</dt>
                  <dd className="text-right font-medium text-zinc-900">Pure FastText Skip-Gram (128d)</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Arsitektur</dt>
                  <dd className="text-right font-medium text-zinc-900">BiLSTM(128) + Dual Pool + Dense(64)</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Regularisasi</dt>
                  <dd className="text-right font-medium text-zinc-900">SpatialDropout 0.20 · Dropout 0.30</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Preprocessing</dt>
                  <dd className="text-right font-medium text-zinc-900">Netral + Syntactic Negation Binding</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Optimizer</dt>
                  <dd className="text-right font-medium text-zinc-900">Adam (lr 0.001) · Balanced Weights</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

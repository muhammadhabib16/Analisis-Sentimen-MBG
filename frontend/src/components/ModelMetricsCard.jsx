import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Award, Layers, Cpu, Grid3X3 } from 'lucide-react'
import { fmtNumber, fmtPct } from '../api'

const CLASSES = ['Negatif', 'Netral', 'Positif']

const DOT = {
  Positif: 'bg-emerald-500',
  Netral: 'bg-amber-500',
  Negatif: 'bg-rose-500',
}

export default function ModelMetricsCard({ metrics }) {
  const cm = metrics?.confusion_matrix || [
    [422, 42, 52],
    [26, 223, 11],
    [47, 25, 306],
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
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-700/60 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-5 text-white shadow-xs">
          <div className="flex items-start justify-between">
            <div className="text-[11px] font-semibold tracking-wider text-blue-200 uppercase">
              Test Accuracy
            </div>
            <Award className="h-4.5 w-4.5 text-blue-200" />
          </div>
          <div className="mt-1.5 font-mono text-3xl font-semibold text-white tabular-nums">
            {fmtPct(testAcc)}
          </div>
          <div className="mt-1.5 text-xs text-blue-100/85">
            Pada {fmtNumber(totalSupport)} sampel uji terisolasi (10%)
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 border-t-3 border-t-blue-600 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Macro F1-Score
            </div>
            <Layers className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div className="mt-1.5 font-mono text-3xl font-semibold text-slate-950 tabular-nums">
            {fmtPct(macroF1)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">Rata-rata seimbang seluruh 3 kelas</div>
        </div>

        <div className="rounded-xl border border-slate-200/90 border-t-3 border-t-sky-500 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Peak Validation Accuracy
            </div>
            <Cpu className="h-4.5 w-4.5 text-sky-600" />
          </div>
          <div className="mt-1.5 font-mono text-3xl font-semibold text-slate-950 tabular-nums">
            {fmtPct(peakVal)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            EarlyStopping ({historyData.length || 0} epoch dijalankan)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Classification Report & Confusion Matrix */}
        <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-7">
          <div className="flex items-center gap-3 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20">
              <Grid3X3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Classification Report &amp; Confusion Matrix
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Model Pure FastText Skip-Gram + BiLSTM (Dual Global Pooling) bebas kebocoran kamus.
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
                    <th className="py-2 pr-3 font-semibold">Kelas</th>
                    <th className="py-2 px-2 text-right font-semibold">Precision</th>
                    <th className="py-2 px-2 text-right font-semibold">Recall</th>
                    <th className="py-2 px-2 text-right font-semibold">F1-Score</th>
                    <th className="py-2 pl-2 text-right font-semibold">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {reportRows.map((r) => (
                    <tr key={r.name} className="hover:bg-blue-50/30">
                      <td className="py-2.5 pr-3 font-sans">
                        <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                          <span className={`h-2 w-2 rounded-full ${DOT[r.name]}`} />
                          {r.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{r.precision.toFixed(4)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{r.recall.toFixed(4)}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-blue-800">
                        {r.f1.toFixed(4)}
                      </td>
                      <td className="py-2.5 pl-2 text-right text-slate-500">{fmtNumber(r.support)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-3 text-[11px] font-semibold tracking-wider text-blue-900 uppercase">
                Confusion Matrix (Baris: Aktual · Kolom: Prediksi)
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                <div />
                {CLASSES.map((c) => (
                  <div key={c} className="pb-1 text-[11px] font-semibold text-slate-500">
                    {c}
                  </div>
                ))}
                {cm.map((row, i) => (
                  <div key={CLASSES[i]} className="contents">
                    <div className="flex items-center justify-end pr-2 text-[11px] font-semibold text-slate-600">
                      {CLASSES[i]}
                    </div>
                    {row.map((val, j) => {
                      const ratio = val / maxCell
                      const alpha = 0.08 + 0.84 * ratio
                      const dark = ratio > 0.42
                      return (
                        <div
                          key={`${i}-${j}`}
                          style={{ backgroundColor: `rgba(30, 64, 175, ${alpha.toFixed(2)})` }}
                          className={`rounded-md py-2.5 font-mono font-semibold ring-1 ring-blue-900/10 tabular-nums ${
                            dark ? 'text-white' : 'text-blue-950'
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
        <section className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-5">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Kurva Pelatihan &amp; Spesifikasi</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Akurasi Training vs Validation per epoch (%).
                </p>
              </div>
            </div>

            <div className="p-5">
              {historyData.length > 0 && (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="epoch"
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <YAxis
                        domain={[50, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <Tooltip
                        formatter={(v) => `${v}%`}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Train"
                        stroke="#1d4ed8"
                        strokeWidth={2.25}
                        dot={{ r: 2.5, fill: '#1d4ed8' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Val"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 2.5, fill: '#0ea5e9' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <dl className="mt-5 space-y-2.5 border-t border-slate-200 pt-4 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Embedding</dt>
                  <dd className="rounded bg-blue-50 px-2 py-0.5 text-right font-medium text-blue-900">
                    Pure FastText Skip-Gram (128d)
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Arsitektur</dt>
                  <dd className="text-right font-medium text-slate-900">BiLSTM(128) + Dual Pool + Dense(64)</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Regularisasi</dt>
                  <dd className="text-right font-medium text-slate-900">SpatialDropout 0.20 · Dropout 0.30</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Preprocessing</dt>
                  <dd className="text-right font-medium text-slate-900">Netral + Syntactic Negation Binding</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Optimizer</dt>
                  <dd className="text-right font-medium text-slate-900">Adam (lr 0.001) · Balanced Weights</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

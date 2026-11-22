import { useState } from 'react'
import { Sparkles, Shuffle, Upload, Download } from 'lucide-react'
import { api, fmtNumber, fmtPct } from '../api'

const BADGE = {
  Positif: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Netral: 'bg-amber-100 text-amber-800 border-amber-200',
  Negatif: 'bg-rose-100 text-rose-800 border-rose-200',
}

const BAR = {
  Positif: 'bg-emerald-500',
  Netral: 'bg-amber-400',
  Negatif: 'bg-rose-500',
}

export default function LivePredictCard() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRandom, setLoadingRandom] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const [batchFile, setBatchFile] = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResult, setBatchResult] = useState(null)
  const [batchError, setBatchError] = useState('')

  async function handleRandom() {
    setLoadingRandom(true)
    setError('')
    try {
      const data = await api.getRandomComment()
      const item = data?.items?.[0]
      if (item?.comment_asli) {
        setText(item.comment_asli)
        setResult(null)
      }
    } catch (err) {
      setError('Gagal mengambil komentar acak. Pastikan server FastAPI berjalan.')
    } finally {
      setLoadingRandom(false)
    }
  }

  async function handlePredict(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.predictSingle(text.trim())
      setResult(res)
    } catch (err) {
      setError('Gagal memprediksi komentar. Pastikan server FastAPI (app.py) berjalan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleBatch() {
    if (!batchFile) {
      setBatchError('Pilih file .csv terlebih dahulu.')
      return
    }
    setBatchLoading(true)
    setBatchError('')
    try {
      const data = await api.predictBatch(batchFile)
      setBatchResult(data)
    } catch (err) {
      setBatchError(`Gagal memproses CSV: ${err.message}`)
    } finally {
      setBatchLoading(false)
    }
  }

  function downloadBatchCsv() {
    if (!batchResult?.items?.length) return
    const header = 'teks_asli,teks_bersih,sentimen,confidence_pct,prob_negatif,prob_netral,prob_positif\n'
    const rows = batchResult.items
      .map(
        (r) =>
          `"${String(r.teks_asli).replace(/"/g, '""')}","${String(r.teks_bersih).replace(/"/g, '""')}",${r.sentimen},${r.confidence_pct},${r.prob_negatif},${r.prob_netral},${r.prob_positif}`,
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hasil_prediksi_batch_mbg.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Uji Komentar Baru (Live BiLSTM)</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Ketik komentar baru atau muat contoh acak dari database untuk diprediksi secara real-time.
        </p>

        <form onSubmit={handlePredict} className="mt-4 space-y-3">
          <textarea
            rows={4}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contoh: program makan bergizi gratis sangat membantu anak sekolah..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRandom}
              disabled={loadingRandom}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Shuffle className="h-3.5 w-3.5" />
              {loadingRandom ? 'Mengambil...' : 'Load Komentar Acak'}
            </button>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {loading ? 'Memproses BiLSTM...' : 'Prediksi Sentimen'}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Teks diproses:</span> {result.teks_bersih || '-'}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-sm font-bold ${BADGE[result.sentimen]}`}>
                {result.sentimen}
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {fmtPct(result.confidence_pct)} yakin
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {['Positif', 'Netral', 'Negatif'].map((cls) => {
                const p = (result.probabilitas?.[cls] || 0) * 100
                return (
                  <div key={cls} className="grid grid-cols-[64px_1fr_48px] items-center gap-2 text-xs">
                    <span className="font-medium text-slate-600">{cls}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${BAR[cls]}`} style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-right font-mono text-slate-700">{fmtPct(p)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-bold text-slate-900">Prediksi Massal via CSV (Batch)</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Unggah file <code className="rounded bg-slate-100 px-1">.csv</code> dengan kolom{' '}
          <code className="rounded bg-slate-100 px-1">comment</code> /{' '}
          <code className="rounded bg-slate-100 px-1">komentar</code> (maks. 5.000 baris).
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-200 file:px-2.5 file:py-1 file:text-xs file:font-semibold"
          />
          <button
            type="button"
            onClick={handleBatch}
            disabled={batchLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {batchLoading ? 'Memproses...' : 'Proses CSV'}
          </button>
          {batchResult && (
            <button
              type="button"
              onClick={downloadBatchCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh CSV
            </button>
          )}
        </div>

        {batchError && <p className="mt-2 text-xs text-rose-600">{batchError}</p>}
        {batchResult && (
          <p className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            Berhasil memprediksi <b>{fmtNumber(batchResult.total_predicted)}</b> komentar (kolom{' '}
            <code>{batchResult.text_column}</code>): Positif{' '}
            <b>{fmtNumber(batchResult.summary?.Positif)}</b> · Netral{' '}
            <b>{fmtNumber(batchResult.summary?.Netral)}</b> · Negatif{' '}
            <b>{fmtNumber(batchResult.summary?.Negatif)}</b>
          </p>
        )}
      </div>
    </section>
  )
}

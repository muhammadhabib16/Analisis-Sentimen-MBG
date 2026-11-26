import { useState } from 'react'
import { ArrowRight, Shuffle, Upload, Download, FileSpreadsheet, Sparkles } from 'lucide-react'
import { api, fmtNumber, fmtPct } from '../api'

const SAMPLE_PROMPTS = [
  'Program makan bergizi gratis sangat membantu anak sekolah di daerah kami',
  'Wah hebat banget programnya sampai banyak anak keracunan',
  'Hari ini jadwal pembagian MBG di SD Negeri 01 pukul sepuluh pagi',
]

const STATUS_STYLE = {
  Positif: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    bar: 'bg-emerald-500',
  },
  Netral: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    bar: 'bg-amber-500',
  },
  Negatif: {
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    bar: 'bg-rose-500',
  },
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
    } catch {
      setError('Gagal mengambil sampel komentar. Pastikan layanan backend aktif.')
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
    } catch {
      setError('Gagal memproses analisis sentimen. Periksa ketersediaan server backend.')
    } finally {
      setLoading(false)
    }
  }

  async function handleBatch() {
    if (!batchFile) {
      setBatchError('Pilih berkas .csv terlebih dahulu.')
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
    const header =
      'teks_asli,teks_bersih,sentimen,confidence_pct,prob_negatif,prob_netral,prob_positif\n'
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
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Single Live Inference */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-7">
        <div className="flex items-center gap-3 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Uji Klasifikasi Komentar Tunggal</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Masukkan opini publik untuk diuji langsung oleh model Pure FastText + BiLSTM.
            </p>
          </div>
        </div>

        <div className="p-5">
          <form onSubmit={handlePredict} className="space-y-3">
            <textarea
              rows={4}
              maxLength={1000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik atau tempel komentar masyarakat terkait program MBG..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-600/12"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRandom}
                disabled={loadingRandom}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-800 disabled:opacity-50"
              >
                <Shuffle className="h-3.5 w-3.5 text-blue-600" />
                {loadingRandom ? 'Mengambil...' : 'Ambil Sampel Acak'}
              </button>

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-40"
              >
                {loading ? 'Memproses...' : 'Analisis Sentimen'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">Contoh cepat:</span>
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(sample)
                  setResult(null)
                }}
                className="rounded-md border border-blue-200/80 bg-blue-50/60 px-2.5 py-0.5 text-[11px] font-medium text-blue-800 transition hover:border-blue-300 hover:bg-blue-100/70"
              >
                Kasus #{idx + 1}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-gradient-to-br from-slate-50 to-blue-50/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[result.sentimen].badge}`}
                >
                  <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[result.sentimen].dot}`} />
                  Sentimen {result.sentimen}
                </span>
                <span className="rounded-md bg-white px-2.5 py-1 font-mono text-xs font-semibold text-blue-900 ring-1 ring-slate-200 tabular-nums">
                  Confidence {fmtPct(result.confidence_pct)}
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-600">
                <span className="font-medium text-slate-500">Token preprocessing: </span>
                <code className="rounded bg-white px-2 py-0.5 text-[11px] text-blue-950 ring-1 ring-blue-200/70">
                  {result.teks_bersih || '-'}
                </code>
              </div>

              <div className="mt-4 space-y-2">
                {['Positif', 'Netral', 'Negatif'].map((cls) => {
                  const p = (result.probabilitas?.[cls] || 0) * 100
                  return (
                    <div key={cls} className="grid grid-cols-[58px_1fr_52px] items-center gap-2.5 text-xs">
                      <span className="font-medium text-slate-600">{cls}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className={`h-full rounded-full ${STATUS_STYLE[cls].bar}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <span className="text-right font-mono font-medium text-slate-700 tabular-nums">
                        {fmtPct(p)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Batch CSV Prediction */}
      <section className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs lg:col-span-5">
        <div>
          <div className="flex items-center gap-3 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Klasifikasi Massal (Batch CSV)</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Unggah data survei hingga 5.000 baris untuk diprediksi sekaligus.
              </p>
            </div>
          </div>

          <div className="p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/35 px-4 py-7 text-center transition hover:border-blue-400 hover:bg-blue-50/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100/80 text-blue-700">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="mt-2.5 text-xs font-semibold text-slate-800">
                {batchFile ? batchFile.name : 'Pilih berkas .csv dari perangkat Anda'}
              </span>
              <span className="mt-1 text-[11px] text-slate-500">
                Wajib memuat kolom <code>comment</code> / <code>komentar</code> (maks. 5 MB)
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            <div className="mt-3.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBatch}
                disabled={batchLoading || !batchFile}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-40"
              >
                <Upload className="h-3.5 w-3.5" />
                {batchLoading ? 'Memproses CSV...' : 'Jalankan Batch Inference'}
              </button>

              {batchResult && (
                <button
                  type="button"
                  onClick={downloadBatchCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Hasil
                </button>
              )}
            </div>

            {batchError && <p className="mt-3 text-xs text-rose-600">{batchError}</p>}

            {batchResult && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-slate-50 p-3.5 text-xs">
                <div className="font-medium text-slate-800">
                  Selesai: <span className="font-mono font-semibold text-blue-700">{fmtNumber(batchResult.total_predicted)}</span>{' '}
                  baris (kolom <code>{batchResult.text_column}</code>)
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-slate-200 pt-2.5 text-center font-mono tabular-nums">
                  <div className="rounded-md bg-white py-1.5 ring-1 ring-slate-200/70">
                    <div className="text-[10px] text-slate-500 uppercase">Positif</div>
                    <div className="font-semibold text-emerald-600">
                      {fmtNumber(batchResult.summary?.Positif)}
                    </div>
                  </div>
                  <div className="rounded-md bg-white py-1.5 ring-1 ring-slate-200/70">
                    <div className="text-[10px] text-slate-500 uppercase">Netral</div>
                    <div className="font-semibold text-amber-600">
                      {fmtNumber(batchResult.summary?.Netral)}
                    </div>
                  </div>
                  <div className="rounded-md bg-white py-1.5 ring-1 ring-slate-200/70">
                    <div className="text-[10px] text-slate-500 uppercase">Negatif</div>
                    <div className="font-semibold text-rose-600">
                      {fmtNumber(batchResult.summary?.Negatif)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

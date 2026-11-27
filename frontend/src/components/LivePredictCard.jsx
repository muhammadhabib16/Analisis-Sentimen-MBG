import { useState } from 'react'
import { ArrowRight, Shuffle, Upload, Download, FileSpreadsheet } from 'lucide-react'
import { api, fmtNumber, fmtPct } from '../api'

const SAMPLE_PROMPTS = [
  'Program makan bergizi gratis sangat membantu anak sekolah di daerah kami',
  'Wah hebat banget programnya sampai banyak anak keracunan',
  'Hari ini jadwal pembagian MBG di SD Negeri 01 pukul sepuluh pagi',
]

const STATUS_STYLE = {
  Positif: { dot: 'bg-[#3b8266]', text: 'text-[#2f6f55]', bar: 'bg-[#3b8266]' },
  Netral: { dot: 'bg-[#829ab1]', text: 'text-[#486581]', bar: 'bg-[#829ab1]' },
  Negatif: { dot: 'bg-[#c05664]', text: 'text-[#a34250]', bar: 'bg-[#c05664]' },
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
      setError('Gagal menghubungi layanan inferensi. Periksa koneksi server backend.')
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
      <section className="overflow-hidden rounded-lg border border-[#dce4ee] bg-white lg:col-span-7">
        <div className="border-b border-[#e4ebf3] bg-[#f8fafd] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#102a43]">Uji Klasifikasi Komentar Tunggal</h2>
          <p className="mt-0.5 text-xs text-[#627d98]">
            Masukkan opini publik untuk diuji secara langsung oleh model Pure FastText + BiLSTM.
          </p>
        </div>

        <div className="p-5">
          <form onSubmit={handlePredict} className="space-y-3">
            <textarea
              rows={4}
              maxLength={1000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik atau tempel komentar masyarakat terkait program MBG..."
              className="w-full rounded-md border border-[#cbd6e2] bg-[#fbfcfe] px-3.5 py-2.5 text-sm text-[#102a43] placeholder:text-[#829ab1] outline-none transition focus:border-[#3b6998] focus:bg-white"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRandom}
                disabled={loadingRandom}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#cbd6e2] bg-white px-3 py-1.5 text-xs font-medium text-[#334e68] transition hover:bg-[#f4f8fc] disabled:opacity-50"
              >
                <Shuffle className="h-3.5 w-3.5 text-[#486581]" />
                {loadingRandom ? 'Mengambil...' : 'Ambil Sampel Acak'}
              </button>

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#23486e] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-[#1b3957] disabled:opacity-40"
              >
                {loading ? 'Memproses...' : 'Analisis Sentimen'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[#829ab1]">Contoh cepat:</span>
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(sample)
                  setResult(null)
                }}
                className="rounded border border-[#dce4ee] bg-[#f4f8fc] px-2 py-0.5 text-[11px] text-[#334e68] transition hover:border-[#c3d2e3] hover:bg-[#eaf1f8]"
              >
                Kasus #{idx + 1}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-[#ebd0d4] bg-[#fcf4f5] px-3 py-2 text-xs text-[#a34250]">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-5 rounded-md border border-[#dce4ee] bg-[#f8fafd] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4ebf3] pb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLE[result.sentimen].dot}`} />
                  <span className={`text-base font-semibold ${STATUS_STYLE[result.sentimen].text}`}>
                    {result.sentimen}
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-[#334e68] tabular-nums">
                  Confidence {fmtPct(result.confidence_pct)}
                </span>
              </div>

              <div className="mt-3 text-xs text-[#486581]">
                <span className="font-medium text-[#627d98]">Token preprocessing: </span>
                <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-[#102a43] ring-1 ring-[#dce4ee]">
                  {result.teks_bersih || '-'}
                </code>
              </div>

              <div className="mt-4 space-y-2">
                {['Positif', 'Netral', 'Negatif'].map((cls) => {
                  const p = (result.probabilitas?.[cls] || 0) * 100
                  return (
                    <div key={cls} className="grid grid-cols-[58px_1fr_52px] items-center gap-2.5 text-xs">
                      <span className="text-[#486581]">{cls}</span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#e4ebf3]">
                        <div
                          className={`h-full rounded-full ${STATUS_STYLE[cls].bar}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <span className="text-right font-mono text-[#334e68] tabular-nums">
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
      <section className="flex flex-col justify-between overflow-hidden rounded-lg border border-[#dce4ee] bg-white lg:col-span-5">
        <div>
          <div className="border-b border-[#e4ebf3] bg-[#f8fafd] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#102a43]">Klasifikasi Massal (Batch CSV)</h2>
            <p className="mt-0.5 text-xs text-[#627d98]">
              Unggah data survei atau komentar hingga 5.000 baris untuk diprediksi sekaligus.
            </p>
          </div>

          <div className="p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#c5d3e2] bg-[#f7fafd] px-4 py-7 text-center transition hover:border-[#9fb3c8] hover:bg-[#f0f5fa]">
              <FileSpreadsheet className="h-6 w-6 text-[#627d98]" />
              <span className="mt-2 text-xs font-medium text-[#243b53]">
                {batchFile ? batchFile.name : 'Pilih berkas .csv dari perangkat Anda'}
              </span>
              <span className="mt-1 text-[11px] text-[#627d98]">
                Wajib memuat kolom <code>comment</code> / <code>komentar</code> (maks. 5 MB)
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBatch}
                disabled={batchLoading || !batchFile}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#23486e] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#1b3957] disabled:opacity-40"
              >
                <Upload className="h-3.5 w-3.5" />
                {batchLoading ? 'Memproses CSV...' : 'Jalankan Batch Inference'}
              </button>

              {batchResult && (
                <button
                  type="button"
                  onClick={downloadBatchCsv}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#cbd6e2] bg-white px-3.5 py-2 text-xs font-medium text-[#334e68] hover:bg-[#f4f8fc]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Hasil
                </button>
              )}
            </div>

            {batchError && <p className="mt-3 text-xs text-[#a34250]">{batchError}</p>}

            {batchResult && (
              <div className="mt-4 rounded-md border border-[#dce4ee] bg-[#f8fafd] p-3.5 text-xs">
                <div className="font-medium text-[#243b53]">
                  Selesai: <span className="font-mono">{fmtNumber(batchResult.total_predicted)}</span>{' '}
                  baris (kolom <code>{batchResult.text_column}</code>)
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#e4ebf3] pt-2.5 text-center font-mono tabular-nums">
                  <div>
                    <div className="text-[10px] text-[#627d98] uppercase">Positif</div>
                    <div className="font-semibold text-[#2f6f55]">
                      {fmtNumber(batchResult.summary?.Positif)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#627d98] uppercase">Netral</div>
                    <div className="font-semibold text-[#486581]">
                      {fmtNumber(batchResult.summary?.Netral)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#627d98] uppercase">Negatif</div>
                    <div className="font-semibold text-[#a34250]">
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

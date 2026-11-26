import { useEffect, useState } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, Database } from 'lucide-react'
import { api, fmtNumber, fmtPct } from '../api'

const PILL = {
  Positif: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  Netral: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  Negatif: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
}

const DOT = {
  Positif: 'bg-emerald-500',
  Netral: 'bg-amber-500',
  Negatif: 'bg-rose-500',
}

export default function CommentsTable({ days }) {
  const [q, setQ] = useState('')
  const [sentiment, setSentiment] = useState('')
  const [sort, setSort] = useState('d')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ total: 0, page: 1, total_pages: 1, items: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [days, q, sentiment, sort])

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.getComments({ q, sentiment, sort, days, page, pageSize: 10 })
        if (!cancelled) setData(res)
      } catch {
        if (!cancelled) setData({ total: 0, page: 1, total_pages: 1, items: [] })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [q, sentiment, sort, days, page])

  function exportPageCsv() {
    if (!data.items.length) return
    const header = 'author,comment_asli,sentimen,confidence_pct,published_at,likes\n'
    const rows = data.items
      .map(
        (r) =>
          `"${String(r.author || '').replace(/"/g, '""')}","${String(r.comment_asli || '').replace(/"/g, '""')}",${r.sentimen},${r.confidence_pct},"${r.published_at || ''}",${r.likes || 0}`,
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `komentar_mbg_halaman_${data.page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Arsip Komentar Publik Terindeks</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Telusuri, saring per kelas sentimen, dan ekspor rekaman komentar dari basis data SQLite.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={exportPageCsv}
          className="inline-flex self-start items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100/80 sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          Ekspor CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-5 py-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kata kunci (mis. keracunan, susu, sekolah, anggaran)..."
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-600/12"
          />
        </div>

        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-600/12"
        >
          <option value="">Semua sentimen</option>
          <option value="Positif">Positif</option>
          <option value="Netral">Netral</option>
          <option value="Negatif">Negatif</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-600/12"
        >
          <option value="d">Urutkan: Terbaru</option>
          <option value="l">Urutkan: Likes terbanyak</option>
          <option value="c">Urutkan: Confidence tertinggi</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-100/70 text-[11px] text-slate-600 uppercase">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Penulis</th>
              <th className="px-4 py-2.5 font-semibold">Komentar</th>
              <th className="px-4 py-2.5 font-semibold">Sentimen</th>
              <th className="px-4 py-2.5 text-right font-semibold">Confidence</th>
              <th className="px-4 py-2.5 font-semibold">Tanggal</th>
              <th className="px-5 py-2.5 text-right font-semibold">Likes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  Memuat data komentar...
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  Tidak ada komentar yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              data.items.map((row) => (
                <tr key={row.id} className="transition hover:bg-blue-50/35">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-blue-900">
                    {row.author || '@anonim'}
                  </td>
                  <td className="max-w-xl px-4 py-3 leading-relaxed text-slate-700">
                    {row.comment_asli}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PILL[row.sentimen] || 'bg-slate-100 text-slate-700'}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${DOT[row.sentimen]}`} />
                      {row.sentimen}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-medium text-slate-700 tabular-nums">
                    {fmtPct(row.confidence_pct)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-500 tabular-nums">
                    {row.published_at ? row.published_at.slice(0, 10) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-slate-600 tabular-nums">
                    {fmtNumber(row.likes)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-600">
        <span className="tabular-nums">
          Menampilkan halaman <b className="text-blue-900">{data.page}</b> dari{' '}
          <b className="text-slate-900">{fmtNumber(data.total_pages)}</b> ({fmtNumber(data.total)}{' '}
          komentar)
        </span>
        <div className="inline-flex gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={page >= data.total_pages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-800 disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  )
}

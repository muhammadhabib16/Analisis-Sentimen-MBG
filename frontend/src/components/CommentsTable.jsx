import { useEffect, useState } from 'react'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, fmtNumber, fmtPct } from '../api'

const PILL = {
  Positif: 'bg-emerald-100 text-emerald-800',
  Netral: 'bg-amber-100 text-amber-800',
  Negatif: 'bg-rose-100 text-rose-800',
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
        const res = await api.getComments({ q, sentiment, sort, days, page, pageSize: 8 })
        if (!cancelled) setData(res)
      } catch (e) {
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Daftar Komentar Masyarakat</h2>
        <p className="text-sm text-slate-500">
          Cari, saring berdasarkan sentimen, dan urutkan komentar asli dari database SQLite.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kata kunci komentar..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
        >
          <option value="">Semua sentimen</option>
          <option value="Positif">Positif</option>
          <option value="Netral">Netral</option>
          <option value="Negatif">Negatif</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
        >
          <option value="d">Terbaru</option>
          <option value="l">Likes terbanyak</option>
          <option value="c">Confidence tertinggi</option>
        </select>

        <button
          type="button"
          onClick={exportPageCsv}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Unduh CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Author</th>
              <th className="px-4 py-3 font-semibold">Komentar</th>
              <th className="px-4 py-3 font-semibold">Sentimen</th>
              <th className="px-4 py-3 text-right font-semibold">Confidence</th>
              <th className="px-4 py-3 font-semibold">Tanggal</th>
              <th className="px-4 py-3 text-right font-semibold">Likes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  Memuat komentar...
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  Tidak ada komentar yang cocok dengan filter ini.
                </td>
              </tr>
            ) : (
              data.items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-800">
                    {row.author || '@anonim'}
                  </td>
                  <td className="max-w-lg px-4 py-3 text-xs leading-relaxed text-slate-700">
                    {row.comment_asli}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL[row.sentimen]}`}>
                      {row.sentimen}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-700">
                    {fmtPct(row.confidence_pct)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {row.published_at ? row.published_at.slice(0, 10) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-700">
                    {fmtNumber(row.likes)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          <b>{fmtNumber(data.total)}</b> komentar ditemukan — halaman <b>{data.page}</b> dari{' '}
          <b>{fmtNumber(data.total_pages)}</b>
        </span>
        <div className="inline-flex gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={page >= data.total_pages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  )
}

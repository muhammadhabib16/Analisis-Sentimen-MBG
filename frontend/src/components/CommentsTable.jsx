import { useEffect, useState } from 'react'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, fmtNumber, fmtPct } from '../api'

const DOT = {
  Positif: 'bg-emerald-600',
  Netral: 'bg-amber-500',
  Negatif: 'bg-rose-600',
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
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Arsip Komentar Publik</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Telusuri, saring berdasarkan sentimen, dan ekspor komentar terklasifikasi dari SQLite.
          </p>
        </div>

        <button
          type="button"
          onClick={exportPageCsv}
          className="inline-flex self-start items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          Ekspor CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50/70 px-5 py-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kata kunci (mis. keracunan, korupsi, sekolah)..."
            className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pr-3 pl-8 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900"
          />
        </div>

        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-900"
        >
          <option value="">Semua sentimen</option>
          <option value="Positif">Positif</option>
          <option value="Netral">Netral</option>
          <option value="Negatif">Negatif</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-900"
        >
          <option value="d">Urutkan: Terbaru</option>
          <option value="l">Urutkan: Likes terbanyak</option>
          <option value="c">Urutkan: Confidence tertinggi</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] text-zinc-500 uppercase">
            <tr>
              <th className="px-5 py-2.5 font-medium">Penulis</th>
              <th className="px-4 py-2.5 font-medium">Komentar</th>
              <th className="px-4 py-2.5 font-medium">Sentimen</th>
              <th className="px-4 py-2.5 text-right font-medium">Confidence</th>
              <th className="px-4 py-2.5 font-medium">Tanggal</th>
              <th className="px-5 py-2.5 text-right font-medium">Likes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-zinc-400">
                  Memuat data komentar...
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-zinc-400">
                  Tidak ada komentar yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              data.items.map((row) => (
                <tr key={row.id} className="transition hover:bg-zinc-50/90">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-zinc-900">
                    {row.author || '@anonim'}
                  </td>
                  <td className="max-w-xl px-4 py-3 leading-relaxed text-zinc-700">
                    {row.comment_asli}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
                      <span className={`h-1.5 w-1.5 rounded-full ${DOT[row.sentimen]}`} />
                      {row.sentimen}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-zinc-600 tabular-nums">
                    {fmtPct(row.confidence_pct)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-500 tabular-nums">
                    {row.published_at ? row.published_at.slice(0, 10) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-zinc-600 tabular-nums">
                    {fmtNumber(row.likes)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500">
        <span className="tabular-nums">
          Menampilkan halaman <b className="text-zinc-900">{data.page}</b> dari{' '}
          <b className="text-zinc-900">{fmtNumber(data.total_pages)}</b> ({fmtNumber(data.total)}{' '}
          komentar)
        </span>
        <div className="inline-flex gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </button>
          <button
            type="button"
            disabled={page >= data.total_pages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  )
}

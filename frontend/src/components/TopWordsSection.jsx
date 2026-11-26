import { useState } from 'react'
import { Hash } from 'lucide-react'
import { fmtNumber } from '../api'

const SENTIMENTS = ['Negatif', 'Positif', 'Netral']

const BAR_COLOR = {
  Positif: 'bg-emerald-500',
  Netral: 'bg-amber-500',
  Negatif: 'bg-rose-500',
}

const DOT_COLOR = {
  Positif: 'bg-emerald-500',
  Netral: 'bg-amber-500',
  Negatif: 'bg-rose-500',
}

export default function TopWordsSection({ topWords = {} }) {
  const [active, setActive] = useState('Negatif')
  const list = topWords[active] || []
  const maxCount = list.length ? list[0].count : 1
  const minCount = list.length ? list[list.length - 1].count : 0
  const cloudList = [...list].sort((a, b) => a.word.localeCompare(b.word))

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50/50 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20">
            <Hash className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Kata Kunci Dominan per Sentimen</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Frekuensi 15 topik kata teratas pasca-normalisasi (di luar daftar stopwords umum).
            </p>
          </div>
        </div>

        <div className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition ${
                active === s
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${active === s ? 'bg-white' : DOT_COLOR[s]}`}
              />
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        <div className="p-5 lg:col-span-5">
          <div className="mb-3 text-[11px] font-semibold tracking-wider text-blue-900 uppercase">
            Peta Sebaran Kata ({active})
          </div>
          <div className="flex min-h-60 flex-wrap content-center items-center justify-center gap-2 rounded-xl border border-blue-100/90 bg-gradient-to-br from-blue-50/50 via-slate-50/60 to-white p-4">
            {cloudList.length === 0 ? (
              <span className="text-xs text-slate-400">Memuat daftar kata...</span>
            ) : (
              cloudList.map((item) => {
                const ratio = (item.count - minCount) / Math.max(1, maxCount - minCount)
                const fontSize = (0.78 + ratio * 0.88).toFixed(2)
                const isTop = ratio > 0.65
                return (
                  <span
                    key={item.word}
                    title={`${fmtNumber(item.count)} kemunculan`}
                    style={{ fontSize: `${fontSize}rem` }}
                    className={`rounded-md border px-2.5 py-0.5 font-medium transition ${
                      isTop
                        ? 'border-blue-200 bg-blue-50/80 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-800'
                    }`}
                  >
                    {item.word}
                  </span>
                )
              })
            )}
          </div>
        </div>

        <div className="p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold tracking-wider text-blue-900 uppercase">
            <span>Peringkat 15 Kata Teratas</span>
            <span>Frekuensi</span>
          </div>
          <ol className="space-y-2">
            {list.map((item, idx) => (
              <li
                key={item.word}
                className="grid grid-cols-[26px_124px_1fr_56px] items-center gap-2.5 text-xs"
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-semibold tabular-nums ${
                    idx < 3 ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/70' : 'text-slate-400'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-medium text-slate-800">{item.word}</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${BAR_COLOR[active]}`}
                    style={{ width: `${(item.count / Math.max(1, maxCount)) * 100}%` }}
                  />
                </div>
                <span className="text-right font-mono font-medium text-slate-600 tabular-nums">
                  {fmtNumber(item.count)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

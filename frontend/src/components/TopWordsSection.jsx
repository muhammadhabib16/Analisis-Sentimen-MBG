import { useState } from 'react'
import { fmtNumber } from '../api'

const SENTIMENTS = ['Negatif', 'Positif', 'Netral']

const BAR_COLOR = {
  Positif: 'bg-emerald-600',
  Netral: 'bg-amber-500',
  Negatif: 'bg-rose-600',
}

const DOT_COLOR = {
  Positif: 'bg-emerald-600',
  Netral: 'bg-amber-500',
  Negatif: 'bg-rose-600',
}

export default function TopWordsSection({ topWords = {} }) {
  const [active, setActive] = useState('Negatif')
  const list = topWords[active] || []
  const maxCount = list.length ? list[0].count : 1
  const minCount = list.length ? list[list.length - 1].count : 0
  const cloudList = [...list].sort((a, b) => a.word.localeCompare(b.word))

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Kata Kunci Dominan per Sentimen</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Frekuensi 15 kata teratas setelah normalisasi teks (di luar stopwords umum).
          </p>
        </div>

        <div className="inline-flex self-start rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition ${
                active === s
                  ? 'bg-white text-zinc-950 shadow-2xs ring-1 ring-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[s]}`} />
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-zinc-200 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        <div className="p-5 lg:col-span-5">
          <div className="mb-3 text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            Peta Kata ({active})
          </div>
          <div className="flex min-h-60 flex-wrap content-center items-center justify-center gap-2 rounded-md border border-zinc-100 bg-zinc-50/70 p-4">
            {cloudList.length === 0 ? (
              <span className="text-xs text-zinc-400">Memuat daftar kata...</span>
            ) : (
              cloudList.map((item) => {
                const ratio = (item.count - minCount) / Math.max(1, maxCount - minCount)
                const fontSize = (0.78 + ratio * 0.92).toFixed(2)
                return (
                  <span
                    key={item.word}
                    title={`${fmtNumber(item.count)} kemunculan`}
                    style={{ fontSize: `${fontSize}rem` }}
                    className="rounded border border-zinc-200 bg-white px-2.5 py-0.5 font-medium text-zinc-800"
                  >
                    {item.word}
                  </span>
                )
              })
            )}
          </div>
        </div>

        <div className="p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            <span>Peringkat 15 Kata Teratas</span>
            <span>Frekuensi</span>
          </div>
          <ol className="space-y-2">
            {list.map((item, idx) => (
              <li
                key={item.word}
                className="grid grid-cols-[24px_120px_1fr_56px] items-center gap-2.5 text-xs"
              >
                <span className="font-mono text-zinc-400 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-medium text-zinc-800">{item.word}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full ${BAR_COLOR[active]}`}
                    style={{ width: `${(item.count / Math.max(1, maxCount)) * 100}%` }}
                  />
                </div>
                <span className="text-right font-mono text-zinc-600 tabular-nums">
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

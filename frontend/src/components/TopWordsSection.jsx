import { useState } from 'react'
import { fmtNumber } from '../api'

const SENTIMENTS = ['Negatif', 'Positif', 'Netral']

const DOT_COLOR = {
  Positif: 'bg-[#3b8266]',
  Netral: 'bg-[#829ab1]',
  Negatif: 'bg-[#c05664]',
}

export default function TopWordsSection({ topWords = {} }) {
  const [active, setActive] = useState('Negatif')
  const list = topWords[active] || []
  const maxCount = list.length ? list[0].count : 1
  const minCount = list.length ? list[list.length - 1].count : 0
  const cloudList = [...list].sort((a, b) => a.word.localeCompare(b.word))

  return (
    <section className="overflow-hidden rounded-lg border border-[#dce4ee] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e4ebf3] bg-[#f8fafd] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#102a43]">Kata Kunci Dominan per Sentimen</h2>
          <p className="mt-0.5 text-xs text-[#627d98]">
            Frekuensi 15 kata teratas setelah normalisasi teks (di luar stopwords umum).
          </p>
        </div>

        <div className="inline-flex self-start rounded-md border border-[#d8e2ee] bg-[#eef3f8] p-0.5">
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition ${
                active === s
                  ? 'bg-white text-[#102a43] shadow-2xs ring-1 ring-[#d3dfec]'
                  : 'text-[#627d98] hover:text-[#102a43]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[s]}`} />
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#e4ebf3] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        <div className="p-5 lg:col-span-5">
          <div className="mb-3 text-[11px] font-medium tracking-wider text-[#627d98] uppercase">
            Peta Kata ({active})
          </div>
          <div className="flex min-h-60 flex-wrap content-center items-center justify-center gap-2 rounded-md border border-[#e4ebf3] bg-[#f7fafd] p-4">
            {cloudList.length === 0 ? (
              <span className="text-xs text-[#829ab1]">Memuat daftar kata...</span>
            ) : (
              cloudList.map((item) => {
                const ratio = (item.count - minCount) / Math.max(1, maxCount - minCount)
                const fontSize = (0.78 + ratio * 0.88).toFixed(2)
                const isPrimary = ratio > 0.65
                return (
                  <span
                    key={item.word}
                    title={`${fmtNumber(item.count)} kemunculan`}
                    style={{ fontSize: `${fontSize}rem` }}
                    className={`rounded border px-2.5 py-0.5 font-medium ${
                      isPrimary
                        ? 'border-[#cbdaea] bg-[#edf3fa] text-[#102a43]'
                        : 'border-[#dfe7f0] bg-white text-[#334e68]'
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
          <div className="mb-3 flex items-center justify-between text-[11px] font-medium tracking-wider text-[#627d98] uppercase">
            <span>Peringkat 15 Kata Teratas</span>
            <span>Frekuensi</span>
          </div>
          <ol className="space-y-2">
            {list.map((item, idx) => (
              <li
                key={item.word}
                className="grid grid-cols-[24px_124px_1fr_56px] items-center gap-2.5 text-xs"
              >
                <span className="font-mono text-[#829ab1] tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-medium text-[#243b53]">{item.word}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f7]">
                  <div
                    className="h-full rounded-full bg-[#4c78a8]"
                    style={{ width: `${(item.count / Math.max(1, maxCount)) * 100}%` }}
                  />
                </div>
                <span className="text-right font-mono text-[#486581] tabular-nums">
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

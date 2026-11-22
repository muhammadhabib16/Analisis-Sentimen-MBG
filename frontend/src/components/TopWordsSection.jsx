import { useState } from 'react'
import { fmtNumber } from '../api'

const SENTIMENTS = ['Positif', 'Netral', 'Negatif']

const THEME = {
  Positif: {
    activeBtn: 'bg-emerald-600 text-white',
    pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bar: 'bg-emerald-500',
  },
  Netral: {
    activeBtn: 'bg-amber-500 text-white',
    pill: 'bg-amber-50 text-amber-800 border-amber-200',
    bar: 'bg-amber-400',
  },
  Negatif: {
    activeBtn: 'bg-rose-600 text-white',
    pill: 'bg-rose-50 text-rose-800 border-rose-200',
    bar: 'bg-rose-500',
  },
}

export default function TopWordsSection({ topWords = {} }) {
  const [active, setActive] = useState('Negatif')
  const list = topWords[active] || []
  const maxCount = list.length ? list[0].count : 1
  const minCount = list.length ? list[list.length - 1].count : 0
  const cloudList = [...list].sort((a, b) => a.word.localeCompare(b.word))
  const style = THEME[active]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Kata yang Paling Sering Muncul</h2>
          <p className="text-sm text-slate-500">
            Pilih kelas sentimen untuk melihat 15 kata dominan dari komentar masyarakat.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                active === s ? THEME[s].activeBtn : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Word Cloud Kata Dominan</h3>
          <div className="flex min-h-56 flex-wrap content-center items-center justify-center gap-2.5">
            {cloudList.length === 0 ? (
              <span className="text-sm text-slate-400">Memuat data kata...</span>
            ) : (
              cloudList.map((item) => {
                const ratio = (item.count - minCount) / Math.max(1, maxCount - minCount)
                const fontSize = (0.85 + ratio * 1.15).toFixed(2)
                return (
                  <span
                    key={item.word}
                    title={`${fmtNumber(item.count)} kali`}
                    style={{ fontSize: `${fontSize}rem` }}
                    className={`rounded-xl border px-3 py-1 font-semibold ${style.pill}`}
                  >
                    {item.word}
                  </span>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Peringkat 15 Kata Teratas</h3>
          <ol className="space-y-2">
            {list.map((item, idx) => (
              <li key={item.word} className="grid grid-cols-[24px_110px_1fr_52px] items-center gap-2 text-xs">
                <span className="font-mono text-slate-400">{idx + 1}.</span>
                <span className="truncate font-medium text-slate-800">{item.word}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${style.bar}`}
                    style={{ width: `${(item.count / Math.max(1, maxCount)) * 100}%` }}
                  />
                </div>
                <span className="text-right font-mono font-semibold text-slate-700">
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

// A song in one of the country's own music styles, with a 30-second preview
// (Apple's public search and chart feeds, no key).
const cache = new Map()

async function topSongs(cc) {
  if (cache.has(cc)) return cache.get(cc)
  const promise = (async () => {
    const res = await fetch(`https://itunes.apple.com/${cc}/rss/topsongs/limit=100/json`)
    if (!res.ok) return []
    const data = await res.json()
    const entries = data?.feed?.entry || []
    return (Array.isArray(entries) ? entries : [entries])
      .map((e) => {
        const links = Array.isArray(e.link) ? e.link : [e.link]
        const preview = links.find((l) => l?.attributes?.['im:assetType'] === 'preview')
        const page = links.find((l) => l?.attributes?.rel === 'alternate')
        const art = e['im:image']?.[e['im:image'].length - 1]?.label || ''
        return {
          title: e['im:name']?.label || '',
          artist: e['im:artist']?.label || '',
          preview: preview?.attributes?.href || '',
          url: page?.attributes?.href || '',
          art: art.replace(/\/\d+x\d+bb\./, '/400x400bb.'),
        }
      })
      .filter((s) => s.preview && s.title)
  })().catch(() => [])
  cache.set(cc, promise)
  return promise
}

// Home-grown music styles per country, searched by genre in that country's catalogue.
// A leading "@xx" means "search the xx store" (for countries without their own).
const STYLES = {
  us: 'country, blues, americana', ca: 'country, indie rock', mx: 'regional mexicano, mariachi',
  gt: 'cumbia, marimba', cr: 'salsa, cumbia', pa: 'salsa, reggaeton', do: 'bachata, merengue',
  pr: '@us, reggaeton, salsa', co: 'vallenato, cumbia', ec: 'pasillo, cumbia', pe: 'cumbia, andina',
  bo: 'folklore, andina', cl: 'cueca, cumbia', ar: 'cuarteto, folklore, cumbia', uy: 'candombe, murga, cumbia',
  br: 'samba, sertanejo, mpb, forró', gb: 'britpop, grime', ie: 'celtic, irish', fr: 'chanson, french pop',
  es: 'flamenco, pop en español', pt: 'fado', it: 'italian pop, cantautori', de: 'schlager, german pop',
  nl: 'nederlandstalig, dutch', be: 'french pop, nederlandstalig', ch: 'schlager, volksmusik',
  at: 'schlager, volksmusik', dk: 'danish', no: 'norwegian', se: 'swedish pop', fi: 'iskelmä, finnish',
  is: 'icelandic', ee: 'estonian', lv: 'latvian', lt: 'lithuanian', pl: 'polish, disco polo', cz: 'czech',
  sk: 'slovak', hu: 'hungarian', ro: 'manele, romanian', bg: 'chalga, bulgarian', gr: 'greek, laïko',
  hr: 'croatian', rs: 'serbian, turbo-folk', si: 'slovenian', ua: 'ukrainian', tr: 'turkish, arabesque',
  il: 'israeli', jo: 'arabic', ae: 'arabic, khaleeji', za: 'amapiano, kwaito', bw: '@za, amapiano',
  ke: 'benga, gengetone, african', ug: 'african', tz: 'bongo flava, african', rw: 'african',
  ng: 'afrobeats, highlife', gh: 'highlife, afrobeats', sn: 'mbalax, african', tn: 'arabic, raï',
  in: 'bollywood, tamil, punjabi', lk: 'sinhala, tamil', bd: 'bangla, bengali', th: 'thai, luk thung',
  kh: 'khmer', my: 'malay', sg: 'mandopop, malay', id: 'indo pop, dangdut', ph: 'opm, pinoy',
  tw: 'mandopop', hk: 'cantopop', jp: 'enka, kayokyoku, j-pop', kr: '@us, k-pop, korean', mn: 'mongolian',
  kg: 'russian', kz: 'kazakh, russian', au: 'australian', nz: 'māori, new zealand',
}

async function searchSongs(store, term) {
  const key = `search:${store}:${term}`
  if (cache.has(key)) return cache.get(key)
  const promise = (async () => {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${store}` +
        `&media=music&entity=song&attribute=genreIndex&limit=50`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || [])
      .map((r) => ({
        title: r.trackName || '',
        artist: r.artistName || '',
        preview: r.previewUrl || '',
        url: r.trackViewUrl || '',
        art: (r.artworkUrl100 || '').replace('100x100bb', '400x400bb'),
      }))
      // drop tracks that only matched because the style's name is in the title
      .filter((s) => s.preview && s.title && !s.title.toLowerCase().includes(term))
  })().catch(() => [])
  cache.set(key, promise)
  return promise
}

async function localStyleSongs(cc, rng) {
  const parts = (STYLES[cc] || '').split(',').map((t) => t.trim()).filter(Boolean)
  const store = parts[0]?.startsWith('@') ? parts.shift().slice(1) : cc
  // start from a random style, then try the others if it comes back thin
  const first = Math.floor(rng() * parts.length)
  for (let i = 0; i < parts.length; i++) {
    const found = await searchSongs(store, parts[(first + i) % parts.length])
    if (found.length >= 8) return found
  }
  return []
}

const REFERENCE = ['us', 'gb', 'de', 'fr', 'br', 'mx', 'jp', 'au', 'za', 'in']
const artistKey = (name) => name.toLowerCase().split(/,|&| feat\.?| x | y /)[0].trim()

// How many other countries' charts each act appears in.
async function spread(cc) {
  const charts = await Promise.all(REFERENCE.filter((r) => r !== cc).map(topSongs))
  const counts = new Map()
  for (const chart of charts) {
    for (const key of new Set(chart.map((s) => artistKey(s.artist)))) {
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  }
  return counts
}

export async function getSong(cc, rng) {
  const pick = (list) => list[Math.floor(rng() * list.length)]
  try {
    const styled = await localStyleSongs(cc, rng)
    if (styled.length) return pick(styled)
    // no style results: fall back to the country's chart, skipping acts that chart abroad
    const [songs, counts] = await Promise.all([topSongs(cc), spread(cc)])
    if (songs.length) {
      const homeGrown = songs.filter((s) => !counts.get(artistKey(s.artist)))
      return pick(homeGrown.length >= 8 ? homeGrown : songs)
    }
    const fallback = await topSongs('us')
    if (fallback.length) return pick(fallback)
  } catch {}
  return null
}

// One shared audio element. It is "unlocked" inside the Teleport tap so phones allow later playback.
const SILENCE =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
let el = null
let fadeTimer = null

export function unlockMusic() {
  if (!el) {
    el = new Audio()
    el.preload = 'auto'
    el.loop = true
  }
  el.src = SILENCE
  el.play().catch(() => {})
}

function fadeTo(target, ms, done) {
  clearInterval(fadeTimer)
  if (!el) return
  const start = el.volume
  const t0 = performance.now()
  fadeTimer = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / ms)
    el.volume = Math.max(0, Math.min(1, start + (target - start) * p))
    if (p >= 1) {
      clearInterval(fadeTimer)
      done?.()
    }
  }, 40)
}

let level = 0.75

export function playSong(song) {
  if (!el) unlockMusic()
  if (!song?.preview) return
  el.src = song.preview
  el.volume = 0
  el.play().then(() => fadeTo(level, 1800)).catch(() => {})
}

export function stopSong() {
  if (!el) return
  fadeTo(0, 500, () => el.pause())
}

export function setMusicMuted(muted) {
  if (el) el.muted = muted
}

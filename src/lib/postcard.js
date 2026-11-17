import { skyFor } from './sky.js'
import { localTime, toF } from './weather.js'
import { formatKm, MAX_ROUND } from './score.js'

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

// Draws a 1080x1350 share card for one round and returns it as a PNG blob.
export async function makePostcard(round, units = 'C') {
  const { loc, weather, song, points, km } = round
  const W = 1080
  const H = 1350
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  try {
    await document.fonts.ready
  } catch {}

  const sky = skyFor(weather)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, sky.top)
  g.addColorStop(1, sky.bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // sun or moon
  ctx.fillStyle = sky.glow
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.arc(820, 300, sky.night ? 70 : 110, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // weather marks
  const kind = weather?.kind
  if (kind === 'rain' || kind === 'storm') {
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = 3
    for (let i = 0; i < 140; i++) {
      const x = (i * 97) % W
      const y = (i * 211) % 760
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - 14, y + 44)
      ctx.stroke()
    }
  } else if (kind === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let i = 0; i < 160; i++) {
      ctx.beginPath()
      ctx.arc((i * 97) % W, (i * 211) % 760, 3 + (i % 3), 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (sky.night) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    for (let i = 0; i < 90; i++) {
      ctx.beginPath()
      ctx.arc((i * 151) % W, (i * 89) % 620, 1.5 + (i % 2), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // horizon hills
  ctx.fillStyle = 'rgba(11,13,20,0.55)'
  ctx.beginPath()
  ctx.moveTo(0, 780)
  ctx.bezierCurveTo(260, 660, 420, 800, 640, 740)
  ctx.bezierCurveTo(820, 690, 960, 760, W, 700)
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.fill()
  ctx.fillStyle = '#0b0d14'
  ctx.fillRect(0, 840, W, H - 840)

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 30px Inter, sans-serif'
  ctx.fillText('E L S E W H E R E', 72, 110)

  // place
  ctx.fillStyle = '#f3f1ea'
  ctx.font = '600 84px Fraunces, Georgia, serif'
  const lines = wrap(ctx, `Near ${loc.near}`, W - 144).slice(0, 2)
  lines.forEach((l, i) => ctx.fillText(l, 72, 950 + i * 92))
  let y = 950 + (lines.length - 1) * 92
  ctx.fillStyle = '#ffc66b'
  ctx.font = '500 44px Inter, sans-serif'
  ctx.fillText(loc.country, 72, (y += 70))

  if (weather) {
    const temp = units === 'F' ? `${toF(weather.tempC)}°F` : `${weather.tempC}°C`
    ctx.fillStyle = 'rgba(243,241,234,0.8)'
    ctx.font = '400 36px Inter, sans-serif'
    ctx.fillText(`${localTime(weather.timezone)} local · ${temp} · ${weather.label}`, 72, (y += 62))
  }

  // song
  const art = await loadImage(song?.art)
  const songY = H - 190
  if (song) {
    let x = 72
    if (art) {
      try {
        ctx.drawImage(art, 72, songY - 10, 110, 110)
        x = 206
      } catch {}
    }
    ctx.fillStyle = '#f3f1ea'
    ctx.font = '600 34px Inter, sans-serif'
    let title = song.title
    while (ctx.measureText(title).width > 520 && title.length > 4) title = title.slice(0, -2)
    ctx.fillText(title === song.title ? title : `${title}…`, x, songY + 38)
    ctx.fillStyle = 'rgba(243,241,234,0.65)'
    ctx.font = '400 30px Inter, sans-serif'
    let artist = song.artist
    while (ctx.measureText(artist).width > 520 && artist.length > 4) artist = artist.slice(0, -2)
    ctx.fillText(artist === song.artist ? artist : `${artist}…`, x, songY + 82)
  }

  // score
  if (typeof points === 'number') {
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffc66b'
    ctx.font = '600 64px Fraunces, Georgia, serif'
    ctx.fillText(`${points.toLocaleString()}`, W - 72, songY + 44)
    ctx.fillStyle = 'rgba(243,241,234,0.65)'
    ctx.font = '400 28px Inter, sans-serif'
    ctx.fillText(`of ${MAX_ROUND.toLocaleString()} · ${formatKm(km)} off`, W - 72, songY + 86)
    ctx.textAlign = 'left'
  }

  let blob = null
  try {
    blob = await new Promise((resolve) => c.toBlob(resolve, 'image/png'))
  } catch {}
  return blob
}

export async function sharePostcard(blob, text) {
  if (!blob) return 'failed'
  const file = new File([blob], 'elsewhere-postcard.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'elsewhere-postcard.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}

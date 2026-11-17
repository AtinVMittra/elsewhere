// Ambient sound made on the fly with Web Audio: rain, wind, night insects, daytime birds.
let ctx = null
let master = null
let current = null

export function unlockAmbient() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 1
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
}

function noiseSource() {
  const len = ctx.sampleRate * 3
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.04 * white) / 1.04 // gentle smoothing keeps the hiss soft
    data[i] = white * 0.55 + last * 6
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

function layerNoise(out, { type, freq, q = 0.7, gain, lfo }) {
  const src = noiseSource()
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq
  filter.Q.value = q
  const g = ctx.createGain()
  g.gain.value = gain
  src.connect(filter).connect(g).connect(out)
  const nodes = [src]
  if (lfo) {
    const osc = ctx.createOscillator()
    osc.frequency.value = lfo.rate
    const depth = ctx.createGain()
    depth.gain.value = lfo.depth
    osc.connect(depth).connect(lfo.target === 'freq' ? filter.frequency : g.gain)
    osc.start()
    nodes.push(osc)
  }
  src.start()
  return nodes
}

function chirp(out, { freq, dur, vol, sweep = 0 }) {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)
  if (sweep) osc.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

export function startAmbient(weather) {
  stopAmbient()
  if (!ctx || !weather) return
  const out = ctx.createGain()
  out.gain.value = 0
  out.connect(master)
  out.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5)
  const nodes = []
  const timers = []
  const { kind, heavy, windKmh, isDay, tempC } = weather

  // a soft bed of air is always present
  nodes.push(...layerNoise(out, { type: 'lowpass', freq: 220, gain: 0.05 }))

  if (kind === 'rain' || kind === 'storm') {
    nodes.push(...layerNoise(out, { type: 'highpass', freq: 1800, gain: heavy ? 0.16 : 0.09 }))
    nodes.push(...layerNoise(out, { type: 'bandpass', freq: 600, q: 0.5, gain: heavy ? 0.12 : 0.05 }))
  }
  if (kind === 'storm') {
    const rumble = () => {
      const src = noiseSource()
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 90
      const g = ctx.createGain()
      const t = ctx.currentTime
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.9, t + 0.4)
      g.gain.exponentialRampToValueAtTime(0.001, t + 4)
      src.connect(f).connect(g).connect(out)
      src.start(t)
      src.stop(t + 4.2)
    }
    timers.push(setInterval(() => Math.random() < 0.5 && rumble(), 9000))
  }
  const wind = Math.min(1, windKmh / 45)
  if (wind > 0.2 || kind === 'snow') {
    nodes.push(
      ...layerNoise(out, {
        type: 'bandpass',
        freq: 380,
        q: 1.4,
        gain: 0.05 + wind * 0.16,
        lfo: { rate: 0.13, depth: 160, target: 'freq' },
      }),
    )
  }
  const dry = kind === 'clear' || kind === 'cloud' || kind === 'fog'
  if (dry && !isDay && tempC >= 12) {
    // night insects: fast pulses of a high tone
    timers.push(
      setInterval(() => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => ctx && chirp(out, { freq: 4300 + Math.random() * 300, dur: 0.05, vol: 0.02 }), i * 70)
        }
      }, 620),
    )
  }
  if (dry && isDay && tempC >= 4) {
    // daytime birds: occasional rising whistles
    timers.push(
      setInterval(() => {
        if (Math.random() < 0.55) {
          const base = 2200 + Math.random() * 1800
          const n = 1 + Math.floor(Math.random() * 3)
          for (let i = 0; i < n; i++) {
            setTimeout(
              () => ctx && chirp(out, { freq: base, dur: 0.12, vol: 0.03, sweep: 1.25 + Math.random() * 0.3 }),
              i * 160,
            )
          }
        }
      }, 1700),
    )
  }
  current = { out, nodes, timers }
}

export function stopAmbient() {
  if (!current || !ctx) return
  const { out, nodes, timers } = current
  current = null
  timers.forEach(clearInterval)
  out.gain.cancelScheduledValues(ctx.currentTime)
  out.gain.setValueAtTime(out.gain.value, ctx.currentTime)
  out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
  setTimeout(() => {
    nodes.forEach((n) => {
      try {
        n.stop()
      } catch {}
    })
    out.disconnect()
  }, 800)
}

export function setAmbientMuted(muted) {
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05)
}

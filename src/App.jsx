import { useEffect, useMemo, useRef, useState } from 'react'
import { REGIONS } from './data/seeds.js'
import { mulberry32, hashString, todayKey } from './lib/rng.js'
import { getMapsKey, saveMapsKey, loadGoogle } from './lib/google.js'
import { pickLocation } from './lib/location.js'
import { getWeather, localTime, partOfDay, toF } from './lib/weather.js'
import { getSong, unlockMusic, playSong, stopSong, setMusicMuted } from './lib/music.js'
import { unlockAmbient, startAmbient, stopAmbient, setAmbientMuted } from './lib/ambient.js'
import { distanceKm, pinPoints, formatKm, scoreSquare, VIBE_BONUS, MAX_ROUND } from './lib/score.js'
import { getDaily, saveDaily, getStreak, getBest, saveBest, getUnits, setUnits as storeUnits } from './lib/storage.js'
import { skyFor } from './lib/sky.js'
import { makePostcard, sharePostcard } from './lib/postcard.js'
import StreetView from './components/StreetView.jsx'
import GuessMap from './components/GuessMap.jsx'
import SongCard from './components/SongCard.jsx'

const ROUNDS = 5

const ERRORS = {
  'missing-key': 'Add a Google Maps key to start playing.',
  'auth-failed': "Google rejected the Maps key. Check that it's valid and allowed on this address.",
  'load-failed': "Couldn't reach Google Maps. Check your connection and try again.",
  'no-street-view': "Couldn't find a place with Street View. Try again.",
}

export default function App() {
  const [phase, setPhase] = useState('home')
  const [mode, setMode] = useState('daily')
  const [rounds, setRounds] = useState([])
  const [current, setCurrent] = useState(null)
  const [vibe, setVibe] = useState(null)
  const [guess, setGuess] = useState(null)
  const [error, setError] = useState(null)
  const [muted, setMuted] = useState(false)
  const [units, setUnits] = useState(getUnits())
  const [streak, setStreak] = useState(getStreak())
  const [hasKey, setHasKey] = useState(!!getMapsKey())
  const [newBest, setNewBest] = useState(false)
  const runId = useRef(0)

  useEffect(() => {
    setMusicMuted(muted)
    setAmbientMuted(muted)
  }, [muted])

  useEffect(() => {
    const onFail = () => {
      runId.current++
      stopSong()
      stopAmbient()
      setError('auth-failed')
      setPhase('home')
    }
    window.addEventListener('elsewhere-maps-auth-failed', onFail)
    return () => window.removeEventListener('elsewhere-maps-auth-failed', onFail)
  }, [])

  const toggleUnits = () => {
    const next = units === 'C' ? 'F' : 'C'
    setUnits(next)
    storeUnits(next)
  }

  async function startRound(index, gameMode, previous) {
    const id = ++runId.current
    setPhase('loading')
    setError(null)
    stopSong()
    stopAmbient()
    const seed =
      gameMode === 'daily' ? hashString(`elsewhere|${todayKey()}|${index}`) : (Math.random() * 2 ** 32) >>> 0
    const rng = mulberry32(seed)
    // keep the round title card up long enough to read
    const titleCard = new Promise((r) => setTimeout(r, gameMode === 'explore' ? 0 : 1600))
    try {
      const loc = await pickLocation(rng, previous.map((r) => r.loc.near))
      const [weather, song] = await Promise.all([
        getWeather(loc.lat, loc.lng).catch(() => null),
        getSong(loc.cc, rng),
      ])
      await titleCard
      if (id !== runId.current) return
      setCurrent({ loc, weather, song })
      setVibe(null)
      setGuess(null)
      startAmbient(weather)
      playSong(song)
      setPhase('blind')
    } catch (e) {
      if (id !== runId.current) return
      setError(ERRORS[e.message] ? e.message : 'load-failed')
      setPhase('home')
    }
  }

  function begin(gameMode) {
    unlockAmbient()
    unlockMusic()
    setMode(gameMode)
    setRounds([])
    setNewBest(false)
    startRound(0, gameMode, [])
  }

  function lockIn() {
    const { loc } = current
    const km = distanceKm(guess, loc)
    const pin = pinPoints(km)
    const bonus = vibe === loc.region ? VIBE_BONUS : 0
    setRounds([...rounds, { ...current, guess, vibe, km, pin, bonus, points: pin + bonus }])
    setPhase('reveal')
  }

  function finish(finalRounds = rounds) {
    stopSong()
    stopAmbient()
    const total = finalRounds.reduce((s, r) => s + r.points, 0)
    if (mode === 'endless') setNewBest(saveBest(total))
    if (mode === 'daily') {
      const slim = finalRounds.map((r) => ({
        near: r.loc.near,
        country: r.loc.country,
        points: r.points,
        km: r.km,
      }))
      setStreak(saveDaily({ total, rounds: slim }))
    }
    setPhase('summary')
  }

  function next() {
    if (mode !== 'explore' && rounds.length >= ROUNDS) finish()
    else startRound(rounds.length, mode, rounds)
  }

  function goHome() {
    runId.current++
    stopSong()
    stopAmbient()
    setPhase('home')
  }

  const shared = { units, toggleUnits, muted, setMuted, goHome }

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink">
      {phase === 'home' && (
        <Home
          begin={begin}
          error={error}
          streak={streak}
          hasKey={hasKey}
          onKey={(k) => {
            saveMapsKey(k)
            setHasKey(true)
            setError(null)
          }}
        />
      )}
      {phase === 'loading' && <Loading mode={mode} rounds={rounds} />}
      {phase === 'blind' && current && (
        <Blind
          {...shared}
          current={current}
          mode={mode}
          rounds={rounds}
          roundNo={rounds.length + 1}
          onPick={(region) => {
            setVibe(region)
            setPhase('look')
          }}
        />
      )}
      {phase === 'look' && current && (
        <Look
          {...shared}
          current={current}
          mode={mode}
          rounds={rounds}
          roundNo={rounds.length + 1}
          vibe={vibe}
          guess={guess}
          setGuess={setGuess}
          lockIn={lockIn}
          teleport={() => startRound(0, mode, [])}
        />
      )}
      {phase === 'reveal' && rounds.length > 0 && (
        <Reveal
          {...shared}
          round={rounds[rounds.length - 1]}
          rounds={rounds}
          mode={mode}
          roundNo={rounds.length}
          total={rounds.reduce((s, r) => s + r.points, 0)}
          next={next}
        />
      )}
      {phase === 'summary' && (
        <Summary rounds={rounds} mode={mode} streak={streak} units={units} begin={begin} goHome={goHome} newBest={newBest} />
      )}
    </div>
  )
}

const pipColor = (points) => {
  const r = points / MAX_ROUND
  if (r >= 0.8) return '#6fcf97'
  if (r >= 0.5) return '#ffc66b'
  if (r >= 0.2) return '#ff7a59'
  return 'rgba(255,255,255,0.35)'
}

// One dot per round: coloured by result once played, ringed while in play.
function Pips({ rounds, current, large }) {
  const size = large ? 'h-3 w-3' : 'h-2 w-2'
  return (
    <span className={`flex items-center ${large ? 'gap-2.5' : 'gap-1.5'}`} aria-hidden="true">
      {Array.from({ length: ROUNDS }, (_, i) => (
        <span
          key={i}
          className={`${size} rounded-full ${i === current && i >= rounds.length ? 'ring-2 ring-white/80' : ''}`}
          style={{ background: i < rounds.length ? pipColor(rounds[i].points) : 'rgba(255,255,255,0.15)' }}
        />
      ))}
    </span>
  )
}

function Hud({ mode, roundNo, rounds }) {
  if (mode === 'explore') return <span className="chip bg-black/50 backdrop-blur">Wandering</span>
  const total = rounds.reduce((s, r) => s + r.points, 0)
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap rounded-full bg-black/55 px-3.5 py-1.5 text-xs backdrop-blur">
      <span className="font-semibold">
        Round {roundNo}/{ROUNDS}
      </span>
      <Pips rounds={rounds} current={roundNo - 1} />
      <span>
        <span className="font-display text-sm font-semibold text-sun">{total.toLocaleString()}</span>{' '}
        <span className="text-white/60">pts</span>
      </span>
    </div>
  )
}

function useCountUp(target, ms = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    let frame
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return value
}

function TopBar({ left, muted, setMuted, goHome }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 safe-t px-3 sm:px-4">
      <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-2">{left}</div>
      <div className="pointer-events-auto flex flex-none items-center gap-2">
        <button
          className="chip bg-black/40 px-3.5 py-2 backdrop-blur hover:bg-black/60"
          onClick={() => setMuted(!muted)}
          aria-pressed={muted}
        >
          {muted ? 'Sound off' : 'Sound on'}
        </button>
        <button className="chip bg-black/40 px-3.5 py-2 backdrop-blur hover:bg-black/60" onClick={goHome}>
          Quit
        </button>
      </div>
    </div>
  )
}

function Home({ begin, error, streak, hasKey, onKey }) {
  const daily = getDaily()
  const [key, setKey] = useState('')
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
      <div className="mb-6 h-16 w-16 animate-fade-in rounded-full bg-sun shadow-[0_0_80px_20px_rgba(255,198,107,0.25)]" />
      <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">Elsewhere</h1>
      <p className="mt-3 max-w-sm text-base text-haze">
        Get dropped somewhere on Earth. Feel the weather, hear what's playing there, then guess where you are.
      </p>

      {error && (
        <p className="mt-5 max-w-sm rounded-xl bg-coral/15 px-4 py-3 text-sm text-coral" role="alert">
          {ERRORS[error]}
        </p>
      )}

      {hasKey && error !== 'auth-failed' ? (
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          {daily ? (
            <div className="rounded-2xl border border-white/10 bg-dusk p-4">
              <div className="text-xs uppercase tracking-widest text-haze">Today's five</div>
              <div className="mt-1 font-display text-3xl">{daily.total.toLocaleString()}</div>
              <div className="mt-1 text-lg">{daily.rounds.map((r) => scoreSquare(r.points)).join('')}</div>
              <div className="mt-1 text-xs text-haze">New places at midnight UTC</div>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => begin('daily')}>
              Play today's five
            </button>
          )}
          <button className={daily ? 'btn-primary' : 'btn-ghost'} onClick={() => begin('endless')}>
            Quick game
          </button>
          <button className="btn-ghost" onClick={() => begin('explore')}>
            Just wander
          </button>
          {(streak > 0 || getBest() > 0) && (
            <div className="text-sm text-haze">
              {streak > 0 && `Daily streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}
              {streak > 0 && getBest() > 0 && ' · '}
              {getBest() > 0 && `Quick game best: ${getBest().toLocaleString()}`}
            </div>
          )}
        </div>
      ) : (
        <form
          className="mt-8 w-full max-w-sm rounded-2xl border border-white/10 bg-dusk p-5 text-left"
          onSubmit={(e) => {
            e.preventDefault()
            if (key.trim()) {
              onKey(key)
              window.location.reload()
            }
          }}
        >
          <div className="text-sm font-semibold">One-time setup</div>
          <p className="mt-1 text-sm text-haze">
            Street View needs a Google Maps key. Set <code className="text-white">VITE_GOOGLE_MAPS_KEY</code> in{' '}
            <code className="text-white">.env</code>, or paste a key here to keep it in this browser.
          </p>
          <input
            className="mt-3 w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm outline-none focus:border-sun"
            placeholder="AIza…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            aria-label="Google Maps key"
            autoComplete="off"
          />
          <button className="btn-primary mt-3 w-full" type="submit">
            Save key
          </button>
        </form>
      )}
      <p className="mt-10 text-xs text-haze/70">Best with sound on.</p>
    </div>
  )
}

function Loading({ mode, rounds }) {
  const total = rounds.reduce((s, r) => s + r.points, 0)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      {mode !== 'explore' && (
        <>
          <div className="text-xs uppercase tracking-[0.3em] text-haze">
            {mode === 'daily' ? "Today's five" : 'Quick game'}
          </div>
          <div className="animate-rise font-display text-6xl font-semibold">
            Round {rounds.length + 1}
            <span className="text-3xl font-normal text-haze"> of {ROUNDS}</span>
          </div>
          <Pips rounds={rounds} current={rounds.length} large />
          {rounds.length > 0 && (
            <div className="text-sm text-haze">
              Score so far <span className="font-semibold text-sun">{total.toLocaleString()}</span>
            </div>
          )}
        </>
      )}
      <p className="mt-4 flex items-center gap-3 font-display text-lg text-haze">
        <span className="h-3 w-3 animate-ping rounded-full bg-sun/70" />
        Travelling…
      </p>
    </div>
  )
}

function useClock(timezone) {
  const [time, setTime] = useState(() => localTime(timezone))
  useEffect(() => {
    setTime(localTime(timezone))
    const t = setInterval(() => setTime(localTime(timezone)), 5000)
    return () => clearInterval(t)
  }, [timezone])
  return time
}

const tempText = (c, units) => (units === 'F' ? `${toF(c)}°F` : `${c}°C`)

function Blind({ current, mode, rounds, roundNo, onPick, units, toggleUnits, ...bar }) {
  const { weather, song } = current
  const sky = useMemo(() => skyFor(weather), [weather])
  const time = useClock(weather?.timezone)
  return (
    <div
      className="flex h-full animate-fade-in flex-col overflow-y-auto"
      style={{ background: `linear-gradient(${sky.top}, ${sky.bottom})` }}
    >
      <TopBar
        {...bar}
        left={<Hud mode={mode} roundNo={roundNo} rounds={rounds} />}
      />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-6 pt-20">
        <p className="animate-rise text-sm uppercase tracking-[0.3em] text-white/70">Eyes closed. You've arrived.</p>
        {weather ? (
          <>
            <div className="mt-3 animate-rise font-display text-7xl font-semibold leading-none sm:text-8xl">{time}</div>
            <div className="mt-2 animate-rise text-lg text-white/85">
              {partOfDay(weather.timezone, weather.isDay)} · {weather.label.toLowerCase()}
            </div>
            <div className="mt-5 flex animate-rise flex-wrap gap-2">
              <button className="chip bg-black/30 py-2 hover:bg-black/50" onClick={toggleUnits} title="Switch units">
                {tempText(weather.tempC, units)} · feels {tempText(weather.feelsC, units)}
              </button>
              <span className="chip bg-black/30">Wind {weather.windKmh} km/h</span>
              <span className="chip bg-black/30">Humidity {weather.humidity}%</span>
              {weather.sunrise && (
                <span className="chip bg-black/30">
                  Sun {weather.sunrise} – {weather.sunset}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="mt-3 font-display text-4xl">The air is still.</div>
        )}

        <div className="mt-6 animate-rise">
          <div className="mb-2 text-xs uppercase tracking-widest text-white/70">On the radio here</div>
          {song ? <SongCard song={song} hideLink /> : <p className="text-sm text-white/70">Silence. No signal.</p>}
        </div>

        {mode === 'explore' ? (
          <button className="btn-primary mt-8" onClick={() => onPick(null)}>
            Open your eyes
          </button>
        ) : (
          <div className="mt-8 animate-rise">
            <div className="mb-2 text-sm text-white/85">
              Which part of the world is this? A right call now is worth +{VIBE_BONUS}.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  className="rounded-xl bg-black/35 px-3 py-3 text-sm font-medium backdrop-blur transition hover:bg-black/55 active:scale-[0.98]"
                  onClick={() => onPick(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="mt-3 w-full py-2 text-sm text-white/70 underline-offset-4 hover:underline" onClick={() => onPick(null)}>
              No idea. Open my eyes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Look({ current, mode, rounds, roundNo, vibe, guess, setGuess, lockIn, teleport, units, ...bar }) {
  const { loc, weather, song } = current
  const [open, setOpen] = useState(false)
  const time = useClock(weather?.timezone)
  return (
    <div className="h-full">
      <StreetView loc={loc} />
      <TopBar
        {...bar}
        left={
          <>
            <Hud mode={mode} roundNo={roundNo} rounds={rounds} />
            {weather && (
              <span className="chip bg-black/50 backdrop-blur">
                {time} · {tempText(weather.tempC, units)} · {weather.label}
              </span>
            )}
            {vibe && <span className="chip bg-black/50 backdrop-blur">Your call: {vibe}</span>}
          </>
        }
      />

      {mode === 'explore' ? (
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 bg-gradient-to-t from-ink via-ink/80 to-transparent p-4 pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-display text-2xl">Near {loc.near}</div>
            <div className="text-sm text-haze">{loc.country}</div>
          </div>
          <div className="flex items-center gap-2">
            {song && <div className="hidden w-72 sm:block"><SongCard song={song} /></div>}
            <button className="btn-primary flex-none" onClick={teleport}>
              Teleport again
            </button>
          </div>
        </div>
      ) : open ? (
        <div className="absolute inset-x-0 bottom-0 z-20 flex h-[58%] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-dusk shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:h-[420px] sm:w-[520px] sm:rounded-2xl">
          <div className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-haze">{guess ? 'Tap again to move your pin' : 'Tap the map to drop a pin'}</span>
            <button className="text-white/80 hover:text-white" onClick={() => setOpen(false)}>
              Look around
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <GuessMap guess={guess} onGuess={setGuess} />
          </div>
          <div className="safe-b px-3 pt-3 sm:pb-3">
            <button className="btn-primary w-full" disabled={!guess} onClick={lockIn}>
              Lock in guess
            </button>
          </div>
        </div>
      ) : (
        <div className="safe-b absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pt-4 sm:justify-end">
          <button className="btn-primary shadow-xl" onClick={() => setOpen(true)}>
            {guess ? 'Back to my pin' : 'Drop your pin'}
          </button>
        </div>
      )}
    </div>
  )
}

function PostcardButton({ round, units, className = 'btn-ghost' }) {
  const [state, setState] = useState('idle')
  const label = { idle: 'Share postcard', busy: 'Making postcard…', downloaded: 'Postcard saved', failed: "Couldn't make postcard" }
  return (
    <button
      className={className}
      disabled={state === 'busy'}
      onClick={async () => {
        setState('busy')
        const blob = await makePostcard(round, units)
        const result = await sharePostcard(blob, `I got dropped near ${round.loc.near}, ${round.loc.country} on Elsewhere.`)
        setState(result === 'downloaded' || result === 'failed' ? result : 'idle')
      }}
    >
      {label[state] || label.idle}
    </button>
  )
}

function Reveal({ round, rounds, mode, roundNo, total, next, units, ...bar }) {
  const { loc, weather, song, km, pin, bonus, points, vibe, guess } = round
  const last = roundNo >= ROUNDS
  const shown = useCountUp(points)
  return (
    <div className="flex h-full flex-col sm:flex-row">
      <TopBar {...bar} left={<Hud mode={mode} roundNo={roundNo} rounds={rounds} />} />
      <div className="h-[42%] flex-none sm:h-full sm:flex-1">
        <GuessMap guess={guess} truth={{ lat: loc.lat, lng: loc.lng }} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 sm:w-[400px] sm:flex-none sm:justify-center sm:pt-16">
        <div className="animate-rise">
          <div className="text-xs uppercase tracking-widest text-haze">Round {roundNo} of {ROUNDS} · you were</div>
          <h2 className="font-display text-3xl font-semibold leading-tight">Near {loc.near}</h2>
          <div className="text-sun">{loc.country}</div>
          {weather && (
            <div className="mt-1 text-sm text-haze">
              {localTime(weather.timezone)} local · {tempText(weather.tempC, units)} · {weather.label}
            </div>
          )}
        </div>
        <div className="grid animate-rise grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-dusk p-3">
            <div className="whitespace-nowrap font-display text-lg sm:text-xl">{formatKm(km)}</div>
            <div className="text-xs text-haze">off</div>
          </div>
          <div className="rounded-xl bg-dusk p-3">
            <div className="font-display text-xl">{pin}</div>
            <div className="text-xs text-haze">pin</div>
          </div>
          <div className="rounded-xl bg-dusk p-3">
            <div className={`font-display text-xl ${bonus ? 'text-sun' : ''}`}>+{bonus}</div>
            <div className="text-xs text-haze">{vibe ? (bonus ? 'vibe call' : `not ${vibe}`) : 'no call'}</div>
          </div>
        </div>
        <div className="animate-rise font-display text-4xl font-semibold">
          +{shown.toLocaleString()} <span className="text-base font-normal text-haze">of {MAX_ROUND.toLocaleString()}</span>
          <div className="mt-1 font-sans text-sm font-normal text-haze">
            Total after round {roundNo}: <span className="font-semibold text-sun">{total.toLocaleString()}</span>
          </div>
        </div>
        <SongCard song={song} />
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary flex-1" onClick={next}>
            {last ? 'See final score' : 'Next round'}
          </button>
          <PostcardButton round={round} units={units} />
        </div>
      </div>
    </div>
  )
}

function Summary({ rounds, mode, streak, units, begin, goHome, newBest }) {
  const [copied, setCopied] = useState(false)
  const total = rounds.reduce((s, r) => s + r.points, 0)
  const max = rounds.length * MAX_ROUND
  const squares = rounds.map((r) => scoreSquare(r.points)).join('')
  const best = rounds.reduce((b, r) => (!b || r.points > b.points ? r : b), null)
  const link = window.location.href.split('#')[0]
  const ratio = max ? total / max : 0
  const rank =
    ratio >= 0.8 ? 'Human compass' : ratio >= 0.6 ? 'Seasoned traveller' : ratio >= 0.4 ? 'Frequent flyer' : ratio >= 0.2 ? 'Weekend tripper' : 'Gloriously lost'
  const shown = useCountUp(total, 1400)
  const text =
    (mode === 'daily' ? `Elsewhere · ${todayKey()}` : 'Elsewhere · quick game') +
    `\n${total.toLocaleString()} / ${max.toLocaleString()}  ${squares}\n${link}`
  return (
    <div className="flex h-full flex-col items-center overflow-y-auto px-6 py-10">
      <div className="w-full max-w-md">
        <div className="text-xs uppercase tracking-widest text-haze">{mode === 'daily' ? "Today's five" : 'Quick game'} · final score</div>
        <div className="mt-1 font-display text-6xl font-semibold">{shown.toLocaleString()}</div>
        <div className="text-haze">of {max.toLocaleString()}</div>
        <div className="mt-2 font-display text-2xl text-sun">{rank}</div>
        {newBest && <div className="mt-1 text-sm text-[#6fcf97]">New personal best</div>}
        <div className="mt-2 text-2xl tracking-wider">{squares}</div>
        {mode === 'daily' && streak > 0 && (
          <div className="mt-1 text-sm text-sun">Daily streak: {streak} {streak === 1 ? 'day' : 'days'}</div>
        )}
        <ul className="mt-6 divide-y divide-white/10 rounded-2xl bg-dusk">
          {rounds.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">Near {r.loc.near}</div>
                <div className="truncate text-xs text-haze">
                  {r.loc.country} · {formatKm(r.km)} off
                </div>
              </div>
              <div className="flex-none font-display text-lg">{r.points.toLocaleString()}</div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            className="btn-primary flex-1"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              } catch {}
            }}
          >
            {copied ? 'Copied' : 'Copy score'}
          </button>
          {best && <PostcardButton round={best} units={units} />}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="btn-ghost flex-1" onClick={() => begin('endless')}>
            New quick game
          </button>
          <button className="btn-ghost flex-1" onClick={goHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

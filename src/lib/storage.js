import { todayKey } from './rng.js'

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {}
}

export function getDaily(day = todayKey()) {
  return read(`elsewhere.daily.${day}`, null)
}

// Saves today's finished game and updates the streak. Returns the streak.
export function saveDaily(result, day = todayKey()) {
  write(`elsewhere.daily.${day}`, result)
  const s = read('elsewhere.streak', { count: 0, last: '' })
  if (s.last === day) return s.count
  const yesterday = todayKey(new Date(new Date(day + 'T00:00:00Z').getTime() - 86400000))
  const next = { count: s.last === yesterday ? s.count + 1 : 1, last: day }
  write('elsewhere.streak', next)
  return next.count
}

export function getStreak() {
  const s = read('elsewhere.streak', { count: 0, last: '' })
  const today = todayKey()
  const yesterday = todayKey(new Date(Date.now() - 86400000))
  return s.last === today || s.last === yesterday ? s.count : 0
}

export function getUnits() {
  return read('elsewhere.units', 'C')
}
export function setUnits(u) {
  write('elsewhere.units', u)
}

export function getBest() {
  return read('elsewhere.best', 0)
}
// Records a quick-game total. Returns true when it beats the previous best.
export function saveBest(total) {
  const best = getBest()
  if (total > best) {
    write('elsewhere.best', total)
    return best > 0
  }
  return false
}

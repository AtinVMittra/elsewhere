export function distanceKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export const MAX_PIN = 1000
export const VIBE_BONUS = 500
export const MAX_ROUND = MAX_PIN + VIBE_BONUS

// Full marks within 25km, then a smooth falloff: ~500 at 1,000km, ~60 at 4,000km.
export function pinPoints(km) {
  if (km <= 25) return MAX_PIN
  return Math.round(MAX_PIN * Math.exp(-(km - 25) / 1450))
}

export function formatKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString()} km`
}

export function scoreSquare(points) {
  const r = points / MAX_ROUND
  if (r >= 0.8) return '🟩'
  if (r >= 0.5) return '🟨'
  if (r >= 0.2) return '🟧'
  return '⬛'
}

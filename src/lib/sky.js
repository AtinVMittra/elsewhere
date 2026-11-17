import { localTime } from './weather.js'

// Sky colours for the "feel it" screen and the postcard, from local time and weather.
export function skyFor(weather) {
  if (!weather) return { top: '#0b0d14', bottom: '#1b2033', glow: '#ffc66b', night: true }
  const h = parseInt(localTime(weather.timezone).slice(0, 2), 10) || 12
  let sky
  if (!weather.isDay) sky = { top: '#070a1a', bottom: '#1a2145', glow: '#dfe6ff', night: true }
  else if (h < 8) sky = { top: '#2b3a67', bottom: '#f2a56b', glow: '#ffd9a0', night: false }
  else if (h >= 17) sky = { top: '#3b2a5c', bottom: '#f0764f', glow: '#ffc66b', night: false }
  else sky = { top: '#1f5fa8', bottom: '#8cc4ec', glow: '#fff2c4', night: false }
  if (['rain', 'storm', 'fog', 'snow'].includes(weather.kind) || weather.label === 'Overcast') {
    sky = weather.isDay
      ? { top: '#3c4657', bottom: '#8792a3', glow: '#d5dbe5', night: false }
      : { top: '#0a0d16', bottom: '#252b3b', glow: '#aab3c7', night: true }
  }
  return sky
}

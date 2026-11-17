// Live conditions from Open-Meteo (free, no key).
const CODES = {
  0: ['Clear sky', 'clear'],
  1: ['Mostly clear', 'clear'],
  2: ['Partly cloudy', 'cloud'],
  3: ['Overcast', 'cloud'],
  45: ['Fog', 'fog'],
  48: ['Freezing fog', 'fog'],
  51: ['Light drizzle', 'rain'],
  53: ['Drizzle', 'rain'],
  55: ['Heavy drizzle', 'rain'],
  56: ['Freezing drizzle', 'rain'],
  57: ['Freezing drizzle', 'rain'],
  61: ['Light rain', 'rain'],
  63: ['Rain', 'rain'],
  65: ['Heavy rain', 'rain'],
  66: ['Freezing rain', 'rain'],
  67: ['Freezing rain', 'rain'],
  71: ['Light snow', 'snow'],
  73: ['Snow', 'snow'],
  75: ['Heavy snow', 'snow'],
  77: ['Snow grains', 'snow'],
  80: ['Light showers', 'rain'],
  81: ['Showers', 'rain'],
  82: ['Violent showers', 'rain'],
  85: ['Snow showers', 'snow'],
  86: ['Heavy snow showers', 'snow'],
  95: ['Thunderstorm', 'storm'],
  96: ['Thunderstorm with hail', 'storm'],
  99: ['Thunderstorm with hail', 'storm'],
}

export async function getWeather(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day` +
    `&daily=sunrise,sunset&forecast_days=1&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('weather-failed')
  const d = await res.json()
  const c = d.current
  const [label, kind] = CODES[c.weather_code] || ['Unsettled', 'cloud']
  return {
    tempC: Math.round(c.temperature_2m),
    feelsC: Math.round(c.apparent_temperature),
    humidity: Math.round(c.relative_humidity_2m),
    windKmh: Math.round(c.wind_speed_10m),
    isDay: c.is_day === 1,
    label,
    kind,
    heavy: [65, 67, 75, 82, 86, 95, 96, 99].includes(c.weather_code),
    timezone: d.timezone,
    sunrise: d.daily?.sunrise?.[0]?.slice(11, 16) || '',
    sunset: d.daily?.sunset?.[0]?.slice(11, 16) || '',
  }
}

export function localTime(timezone, date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(date)
  } catch {
    return ''
  }
}

export function partOfDay(timezone, isDay) {
  const h = parseInt(localTime(timezone).slice(0, 2), 10)
  if (Number.isNaN(h)) return isDay ? 'day' : 'night'
  if (h >= 5 && h < 8) return 'early morning'
  if (h >= 8 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

export const toF = (c) => Math.round((c * 9) / 5 + 32)

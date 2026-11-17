// Loads the Google Maps JavaScript API once.
let promise = null

export function getMapsKey() {
  let stored = ''
  try {
    stored = localStorage.getItem('elsewhere.mapsKey') || ''
  } catch {}
  return import.meta.env.VITE_GOOGLE_MAPS_KEY || stored
}

export function saveMapsKey(key) {
  try {
    localStorage.setItem('elsewhere.mapsKey', key.trim())
  } catch {}
}

export function loadGoogle() {
  if (window.google?.maps?.StreetViewService) return Promise.resolve(window.google)
  if (promise) return promise
  const key = getMapsKey()
  if (!key) return Promise.reject(new Error('missing-key'))
  promise = new Promise((resolve, reject) => {
    window.__elsewhereMapsReady = () => resolve(window.google)
    window.gm_authFailure = () => {
      promise = null
      reject(new Error('auth-failed'))
      window.dispatchEvent(new Event('elsewhere-maps-auth-failed'))
    }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=__elsewhereMapsReady`
    s.async = true
    s.onerror = () => {
      promise = null
      reject(new Error('load-failed'))
    }
    document.head.appendChild(s)
  })
  return promise
}

import { SEEDS, regionOf, countryName } from '../data/seeds.js'
import { loadGoogle } from './google.js'

function findPanorama(google, lat, lng, radius) {
  const sv = new google.maps.StreetViewService()
  return sv
    .getPanorama({
      location: { lat, lng },
      radius,
      preference: google.maps.StreetViewPreference.NEAREST,
      sources: [google.maps.StreetViewSource.GOOGLE || google.maps.StreetViewSource.OUTDOOR],
    })
    .then((res) => res.data)
    .catch(() => null)
}

// Picks a populated area, nudges the point up to ~35km away, then snaps to the
// nearest official Google Street View panorama (no user-uploaded photos). Retries with a wider search if needed.
export async function pickLocation(rng, usedNames = []) {
  const google = await loadGoogle()
  for (let attempt = 0; attempt < 8; attempt++) {
    let seed = SEEDS[Math.floor(rng() * SEEDS.length)]
    if (usedNames.includes(seed.name)) seed = SEEDS[Math.floor(rng() * SEEDS.length)]
    const dist = 0.32 * Math.sqrt(rng())
    const angle = rng() * Math.PI * 2
    const lat = seed.lat + dist * Math.sin(angle)
    const lng = seed.lng + (dist * Math.cos(angle)) / Math.max(0.3, Math.cos((seed.lat * Math.PI) / 180))
    const data =
      (await findPanorama(google, lat, lng, 3000)) ||
      (await findPanorama(google, lat, lng, 25000)) ||
      (await findPanorama(google, seed.lat, seed.lng, 5000))
    if (!data?.location?.latLng) continue
    return {
      pano: data.location.pano,
      lat: data.location.latLng.lat(),
      lng: data.location.latLng.lng(),
      near: seed.name,
      cc: seed.cc,
      country: countryName(seed.cc),
      region: regionOf(seed.cc),
      street: data.location.description || '',
    }
  }
  throw new Error('no-street-view')
}

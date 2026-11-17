import { useEffect, useRef } from 'react'

const DARK = [
  { elementType: 'geometry', stylers: [{ color: '#1b2033' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#aab1c5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0d14' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0d14' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#444c66' }] },
]

const dot = (color) => ({
  path: window.google.maps.SymbolPath.CIRCLE,
  scale: 9,
  fillColor: color,
  fillOpacity: 1,
  strokeColor: '#0b0d14',
  strokeWeight: 3,
})

// World map for dropping a pin. With `truth` set it shows the answer and the gap instead.
export default function GuessMap({ guess, onGuess, truth }) {
  const ref = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const onGuessRef = useRef(onGuess)
  onGuessRef.current = onGuess

  useEffect(() => {
    const g = window.google.maps
    map.current = new g.Map(ref.current, {
      center: { lat: 20, lng: 10 },
      zoom: 1,
      minZoom: 1,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      draggableCursor: 'crosshair',
      styles: DARK,
      backgroundColor: '#0b0d14',
      clickableIcons: false,
    })
    if (truth) {
      const real = new g.Marker({ position: truth, map: map.current, icon: dot('#ffc66b'), title: 'Actual place' })
      const bounds = new g.LatLngBounds()
      bounds.extend(truth)
      if (guess) {
        new g.Marker({ position: guess, map: map.current, icon: dot('#ff7a59'), title: 'Your guess' })
        new g.Polyline({
          path: [guess, truth],
          map: map.current,
          geodesic: true,
          strokeColor: '#f3f1ea',
          strokeOpacity: 0,
          icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '14px' }],
        })
        bounds.extend(guess)
        map.current.fitBounds(bounds, 60)
      } else {
        map.current.setCenter(real.getPosition())
        map.current.setZoom(4)
      }
    } else {
      map.current.addListener('click', (e) => {
        onGuessRef.current?.({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      })
    }
  }, [])

  useEffect(() => {
    if (truth || !map.current) return
    if (!guess) {
      marker.current?.setMap(null)
      marker.current = null
      return
    }
    if (!marker.current) {
      marker.current = new window.google.maps.Marker({ map: map.current, icon: dot('#ff7a59'), title: 'Your guess' })
    }
    marker.current.setPosition(guess)
  }, [guess, truth])

  return <div ref={ref} className="h-full w-full" />
}

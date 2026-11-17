import { useEffect, useRef } from 'react'

export default function StreetView({ loc }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !window.google) return
    const pano = new window.google.maps.StreetViewPanorama(ref.current, {
      pano: loc.pano,
      pov: { heading: Math.random() * 360, pitch: 0 },
      zoom: 0,
      addressControl: false,
      showRoadLabels: false,
      fullscreenControl: false,
      zoomControl: false,
      panControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      enableCloseButton: false,
      linksControl: true,
      clickToGo: true,
    })
    return () => pano.setVisible(false)
  }, [loc.pano])

  return <div ref={ref} className="absolute inset-0 animate-fade-in" aria-label="Street View of the mystery place" />
}

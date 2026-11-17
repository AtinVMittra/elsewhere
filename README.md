# Elsewhere

A teleport game you hear before you see. You're dropped somewhere on Earth with your eyes closed:
you get the local time, the live weather, ambient sound and a song from that country's chart.
Call the region for a bonus, then open your eyes in Street View and drop a pin.

- **Today's five**: the same five places for everyone each day, with a streak and a shareable score.
- **Quick game**: five random places, with a personal best to beat.
- **Just wander**: no scoring.

No backend and no AI. It's a static site.

## Run it locally

```bash
npm install
cp .env.example .env   # then put your Google Maps key in .env
npm run dev
```

## Google Maps key (one-time)

1. In Google Cloud, create a project with billing enabled and turn on **Maps JavaScript API**.
2. Create an API key. Under *Application restrictions* choose **Websites** and allow
   `http://localhost:*/*` and `https://<your-user>.github.io/*`.
3. Under *API restrictions*, limit the key to Maps JavaScript API.
4. Set a daily quota cap on the API so a busy day can't surprise you.

The key ships in the page, which is normal for Google Maps. The website restriction is what protects it.

## Deploy to GitHub Pages

1. Push this folder as its own GitHub repository (the workflow lives in `.github/workflows/pages.yml`).
2. Repo **Settings → Secrets and variables → Actions**: add `VITE_GOOGLE_MAPS_KEY`.
3. Repo **Settings → Pages**: set *Source* to **GitHub Actions**.
4. Push to `main`. The site appears at `https://<your-user>.github.io/<repo>/`.

## Where the data comes from

- Street View and the pin map: Google Maps JavaScript API
- Weather, local time, sunrise and sunset: Open-Meteo (no key)
- Songs and 30-second previews: Apple's public top-songs feed per country (no key)
- Rain, wind, insects and birds: generated in the browser with Web Audio

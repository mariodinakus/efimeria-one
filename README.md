# EFIMERIA ONE

A responsive, Greece-first hospital/pharmacy location finder, designed for Vercel. **Important: location discovery is not live on-duty verification.** The app provides a map of healthcare facilities from OpenStreetMap and direct links to official duty schedules. It must never be used to decide where to go in a life-threatening emergency: call 112 or 166.

## Features

- Device geolocation (only with user consent), town/city search, 3–30 km radius.
- Dynamic real OSM hospital/pharmacy discovery through a serverless Overpass proxy; results sorted by straight-line distance, phone (when available), one-tap directions.
- Interactive Leaflet map with markers and navigation, mobile-friendly responsive design and dark/light modes.
- Hospital medical-specialty selector **with clear warning that the filter is not verified**. Never treats an OSM amenity as proof of a specific duty or specialty.
- Direct source navigation to 4th Health District (Thessaloniki), Ministry of Health, Association of Pharmacists of Thessaloniki/Attica, official national duty portal and national e-health pharmacy directory.
- Installable PWA shell, no account / no app tracking / no third-party advertising / no API key.
- Graceful failure when free third-party map/geocoding services are unavailable.

## Run locally

Node.js >=20 required. No npm dependencies.

```bash
npm run dev
# open http://localhost:3000
npm run check
```

## GitHub → Vercel

1. Create an empty repository called `efimeria-one` in GitHub.
2. Upload **all project files in the root** (not the enclosing folder).
3. Go to Vercel > Add New > Project > import the repository.
4. Choose Framework Preset **Other** (static HTML + Vercel `/api` Functions), Root Directory `./`, leave Build Command and Output Directory blank. Deploy.
5. No secret env vars or API keys required.

## Data accuracy & safety

- `/api/nearby.js` queries Overpass / OpenStreetMap **for geographic facilities only**. `verifiedOnDuty` is always `false` by design. Results may be missing or outdated because OSM is crowdsourced; no responsibility for medical choices is implied.
- `/api/places.js` searches Greek town names via a public Photon service. Both serverless endpoints bound query inputs and provide suitable errors. Public endpoint rate limits may apply.
- The specialty selector does not filter unverified specialty records. It reminds the user to check the official duty program, which differs by specialty and time.
- No location history or third-party analytics is stored by the application. Coordinates necessarily transit Vercel Functions and the third-party map provider when used; infrastructure logs may exist independently. Map tile providers may see IP addresses.
- To display verified on-duty statuses in-app in a future release, an authoritative, licensed source with per-facility, per-specialty current duty schedules and update timestamps is needed. **Do not scrape schedules and label them verified without dependable coverage.**
- Calls to 112 / 166 use the device's dialer; this app does not call emergency services itself.

### Verified public links (as of October 2026)

- Greek central duty directory: https://efimeries.gov.gr/
- Ministry of Health hospitals: https://www.moh.gov.gr/articles/citizen/efhmeries-nosokomeiwn/
- 4th Health District Thessaloniki schedule: https://www.4ype.gr/efimeries-nosokomeion/
- Thessaloniki pharmacist association: https://efimeries.fsth.gr/
- Attica pharmacist association: https://fsa-efimeries.gr/Home/
- National e-health pharmacy directory: https://ehealthrecord.gov.gr/pharmacies
- Gov.gr EKAB 166: https://www.gov.gr/el/sdg/healthcare/national-emergency-numbers/general/166

## Tech

Vanilla JavaScript, CSS, Leaflet (via UNPKG), CARTO OSM-based map tiles, Vercel Functions (ES modules), Overpass & Photon open services. No build pipeline, installation or paid API keys required.

# EFIMERIA ONE v3 — duty-schedule quick finder

A mobile-first, bilingual (Greek/English) **map-free** experience for finding published hospital/pharmacy duty schedules in Greece.

## Usage

1. Enter an area (or grant GPS once).
2. Set the duty date, then choose **Hospitals** or **Pharmacies**.
3. For hospitals, optionally choose a medical specialty as a reminder; confirm that specialty in the actual published roster.
4. Open the prioritized official roster source for that area. For Attica hospitals, the app additionally tries to find date-specific PDF/document links on the Greek Health Ministry website using /api/attica-roster.
5. Once you have confirmed the provider in the published roster, enter the name or street address to open Google Maps directions.

## Critical accuracy limitation

This is a **source navigation app**, **not a nationwide verified real-time duty API**. It does not provide in-app named, live verified duty providers in all Greek municipalities. The Ministry publishes hospital rotas in varying formats, often PDF, and pharmacy associations operate separate services (some requiring authorization). A listed source or map search is NOT evidence that a particular provider is on duty. Do not use unverified results in emergencies. Call **112** or **166** if urgent.

## Sources

- Greek public national duty portal: https://efimeries.gov.gr/
- Greek Ministry of Health: https://www.moh.gov.gr/articles/citizen/efhmeries-nosokomeiwn/
- Attica daily hospital duty PDFs: https://www.moh.gov.gr/articles/citizen/efhmeries-nosokomeiwn/68-efhmeries-nosokomeiwn-attikhs
- Thessaloniki hospital roster: https://www.4ype.gr/efimeries-nosokomeion/
- Thessaloniki pharmacists: https://efimeries.fsth.gr/
- Attica pharmacists: https://fsa-efimeries.gr/Home/
- Nationwide pharmacy source directory: https://ehealthrecord.gov.gr/pharmacies

## Deployment

The root index.html is self-contained and framework-free. Vercel automatically detects /api/places.js, /api/reverse.js, and /api/attica-roster.js as serverless functions. No paid API key is required for the map-free frontend. Existing legacy map-related files remain in the repository for reference but are no longer loaded.

## Privacy

Geolocation is opt-in. The app does not deliberately store location server-side, but location lookups use external services that may process request metadata. Prefer manual area entry if desired.

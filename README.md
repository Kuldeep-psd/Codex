# Drift POC

Frontend-only proof of concept for **Drift**: an anti-navigation interface that nudges users into safe, playful urban wandering.

## What this POC includes

- Vague Compass (directional cue, no turn-by-turn route)
- Generative situational prompts from local mock city data
- Invisible Leash toggle (filters out low-safety mock zones)
- Serendipity Pings (vibration when a hidden gem is encountered)
- Return Home override (safe fallback language + home anchor)

## Stack

- Plain HTML/CSS/JS
- No backend
- No API keys

## Run locally

Just open `index.html` in a browser.

For best behavior:
- Allow location access (optional, used only for rough drift radius + home anchor)
- Use a mobile device to test vibration support

## Deploy on Vercel

1. Import this repo in Vercel.
2. Framework preset: **Other**.
3. Build command: leave empty.
4. Output directory: leave empty (root static files).
5. Deploy.

Because this is static-only, no backend setup is needed.

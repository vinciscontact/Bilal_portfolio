# BILLAL.EDITS — The Director's Cut (Portfolio)

A cinematic single-page portfolio for Billal — video editor & content creator, Chennai.
Built with vanilla HTML/CSS/JS + GSAP 3 (ScrollTrigger, SplitText) + Lenis smooth scroll.
No build step — open `index.html` or host the folder anywhere (Netlify/Vercel/GitHub Pages).

## Features
- **Film-leader preloader** — counts to 100%, letterbox bars open like cinema curtains
- **Hero** — giant type interwoven with the trio cutout (`Images/hero.png`), char-cascade entrance, parallax exit
- **SC.01 Story** — masked line reveals, manifesto words light up as you read, count-up stats
- **SC.02 Work** — pinned horizontal film-strip on desktop (sprocket-hole cards), stacked on mobile
- **SC.03 Family** — tilted phone mockups of the IG profile, floating FOLLOW badge
- **SC.04 Contact** — scroll-lit headline + IG / YouTube CTAs. At the final scroll the
  headline **collapses under gravity** (Matter.js): letters fall heavy, pile up, and can be
  dragged/thrown with mouse or touch. `RESET THE MESS ↺` flies every letter back into place.
- **Editor timeline scrubber** — fixed bottom bar with playhead + live 24fps timecode
- **LIGHTS toggle** — red/black ⇄ white/red theme (persisted in localStorage)
- **SOUND toggle** — generated ambient score (Web Audio, no files); scroll velocity opens the
  filter and swells volume. Starts only on user click (browser autoplay rules).
- Film grain, custom cursor, `prefers-reduced-motion` support, fully responsive.

## Things you may want to edit

| What | Where |
| --- | --- |
| Individual reel links | `index.html` — each `.film-card` `href` currently points to the IG profile. Replace with exact reel URLs when ready. |
| YouTube link | `index.html` — search `yt.openinapp.co/zxlia` (the link from the IG bio). Swap for the full channel URL. |
| Instagram link | search `instagram.com/billal.edits` |
| About text / stats | `index.html` — SC.01 section (`data-count` attributes drive the count-ups) |
| Colors / themes | `css/style.css` — `:root` and the two `html[data-theme]` blocks |
| Music character | `js/script.js` — `CinematicScore` class (`notes` array = the chord; `baseGain` = volume) |

## Cache-busting
Asset links carry `?v=N`. If you edit `css/style.css` or `js/script.js` and don't see changes,
bump the number in `index.html`.

## Credits
Design & build: 2026. All GSAP plugins are free (Webflow-era licensing) — loaded via jsDelivr CDN.

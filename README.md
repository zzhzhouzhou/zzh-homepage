# zzh — Garbage Human Studio homepage (v3.1)

Personal homepage for **zzh.loc.cc**. Static Astro site in a photocopy-brutalist look (raw paper #ECE9E2, ink #0E0E0E, International Klein Blue #002FA7 as the only colour). The setting is the studio's own: a **deep-water field archive** kept by a developer — a dive that descends through four logs (I WHO at 12 m, II WORKS at 200 m, III SIGNAL at 1000 m) and surfaces in IV, with the whale shark (*Rhincodon typus*) as specimen 01. Graphic language: diagonal hatch texture cut through big titles, log cards with Roman numerals, dossiers, specimen labels, tide tables, sonar traces, film strips, tracing-paper overlays, crop/registration marks and colour bars, all aligned to the 12-column grid. English only. No trackers, no third-party requests.

## Stack
- Astro 7 (static output), plain CSS
- GSAP 3.15 (ScrollTrigger, SplitText) + Lenis smooth scroll
- Two canvases: hero shark (raster + live ASCII tail) and the site-wide rain/particle layer; a third for the contact "sink" scene
- Art in `public/img/v3/` (WebP with alpha, darkness→alpha so it multiplies onto the paper). Sources + pipeline: `../art3/` (`make_assets.py`; the shark uses the same spot-softening as `../brut/compose2.py`). v3.1 adds `gauge.webp` + `jar.webp` (`../art3/make_v31.py`, generated photos → photocopy B/W + grain) and the contact-strip tile `film.webp` (`../art3/make_film.py`)

## Fonts and licences (`public/fonts/licenses/`)
- **HarmonyOS Sans Condensed** Black/Bold (© Huawei Device Co., Ltd.): the official TTFs, **unmodified**. The licence forbids modifying or subsetting the files and requires attribution, so the footer carries the notice.
- **Instrument Serif** (regular + italic), **Big Shoulders Stencil** (800 instance) and **JetBrains Mono**: SIL OFL 1.1, subset to WOFF2 with `npm run fonts`

## Run
```bash
npm install
npm run dev              # http://localhost:4321
npm run build            # -> dist/
npm run preview:single   # one self-contained file -> ../preview/index.html
npm run fonts            # re-subset the OFL fonts after copy changes
npm run assets           # rebuild public/img/v3 from ../art3/src and ../brut/shark_real_bw.png
```

## Structure
```
src/pages/index.astro       all sections: S0 VHS loader (2000 → 2026), S1 hero (1440x900 design stage), Logs I–IV
src/components/             Chapter (log card + dive readout), Stamp, Barcode, ColorBar, Reg (registration mark),
                            EdgeRuler (section depth scale), Wave (sonar trace), Sonar (PPI scope), Specimen (label)
src/scripts/main.js         boot, Lenis, stage fit, loader, hero intro / idle / scroll tear, global ticker
src/scripts/hero.js         SharkCanvas: masked raster + live ASCII cells, glitch bands, tail wave, glance, tear
src/scripts/fx.js           rain + point/line/plane particles, VHS flicker, scramble, cursor + click sparkle, magnetic, marquees
src/scripts/scenes.js       log cards, HUD (year + dive depth), WHO paper flutter, WORKS drawer + push-in + depth gauge,
                            SIGNAL keyboard + leap + punched tape/trace, CONTACT ascent + sink, [data-depth] parallax
src/styles/global.css       palette, hatch texture, field-archive materials (crops, halftone, Ben-Day, trace, tapes, stamps, film), responsive and reduced-motion rules
public/CNAME                zzh.loc.cc
```
Easter egg: type `z z h` anywhere and the shark leaps across the screen.

## Security
Meta CSP: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'self'; form-action 'none'`. No inline scripts in the build. The single-file preview uses its own CSP (`default-src 'none'` plus inline/data allowances).

## Accessibility / motion
`prefers-reduced-motion: reduce` skips the loader, smooth scroll, pins, canvases' animation (one static frame), cursor and flicker; the works drawer becomes a plain grid.

## Deploy
Same as v2: GitHub Pages (Actions workflow building `dist/`), custom domain `zzh.loc.cc` (CNAME in `public/`), NodeLoc DNS pointing `zzh` at GitHub Pages. Not deployed from here.

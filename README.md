# Period Atlas · Cycles Around Us

[中文](README.zh-CN.md) · **English**

A set of *animated curves* for the periodic phenomena in ordinary life — from melatonin,
body temperature and the commute peak inside one day, through moon phases and tides inside
one month, to solar elevation, farming seasons and league seasons inside one year, and on to
leap years and the solar cycle across several years.

Plus a **3D solar-system view**: eight planets orbiting the Sun on their real sidereal
periods, with a per-body preview panel.

Built with React 18 + TypeScript + Vite 5 + three.js. No external assets, no CDN, no network
requests at runtime.

## Run it

```bash
npm install
npm run dev        # dev server
npm run build      # tsc -b && vite build → multi-file dist/
npm run preview    # serve dist/ over HTTP (do NOT open dist/index.html via file://)
npm run check:data # data-layer parity/invariant checks
```

`npm run build` emits a standard multi-file `dist/` — assets are absolutely pathed, so the
built page must be served over HTTP. Opening `dist/index.html` from disk shows a blank page.

## Using it

- **Industry dropdown** — 13 industries: Everyday Life, Agriculture, Space & Aerospace,
  Ocean & Fisheries, Health & Medicine, Energy & Power, Transport & Logistics,
  Finance & Retail, Manufacturing, Education, Tourism, Sports & Venues, Media & Content.
  Pick one and only that one shows; "All industries" puts everything on screen together.
- **Time-scale buttons** — five layers: one day (24 h), one week (7 d), one month (28–31 d),
  one year (365.25 d), several years (4 y). Toggling a layer only affects visibility.
- The two filters are independent. A hidden curve's clock is *frozen* — showing it again
  does not make it "skip" the time it was away.
- **Play / pause**, **speed** (slow / normal / fast: one day per 48 / 16 / 8 s), and a
  **scrubber** for the 24-hour layer.
- **Wave / Phase-ring** — the ring overlays every series from the one-day layer onto a single
  24-hour dial, so one clock time lands on one radius.
- **Solar system (3D)** — drag to orbit, scroll to zoom, click a planet (or its chip) to
  focus it, choose a time rate (1 day … 10 years per second), and read a body's real
  parameters in the preview panel.
- **Table view** — an accessible equivalent table of every series (scale, period, active
  window, peak, current value, everyday example).
- **Dark mode** — top right. Dark is not an automatic inversion; it is a *separately chosen*
  set of validated steps from the same ramps.

## Every chart carries its own y-axis

Curve shapes are normalized to a 0–1 height internally, but **displayed in each series' own
real physical unit and range**:

| Series | y-axis |
|---|---|
| Moon phase | illuminated fraction, % |
| Tide | sea level, m |
| Morning blood-pressure surge | systolic, mmHg |
| Core body temperature | °C |
| Rocket-engine ignition | thrust, % of rated |
| Tank fill / LOX boil-off | tank level, % |

So this is a **grid of small multiples**: each x-axis spans its own period, each y-axis uses
its own dimension — read a single chart's peaks and troughs vertically, but **do not compare
heights across two charts**. Series with no single physical quantity (commute peak, ratings
index) are honestly labelled 指数 — "index".

## Why colour is a ramp, not a categorical palette

13 industries and dozens of curves far exceed what one categorical palette's 8 slots can
carry — forcing a 9th hue produces a colour indistinguishable from an existing one under
colour-vision deficiency. So:

- **Colour encodes the time scale** — an ordinal blue ramp, light to dark, one step per
  layer, each with its own full name and span text. Identity is never carried by colour alone.
- **Colour follows the entity, not the filter** — switching industry never repaints the
  survivors, only shows or hides them.
- 7 categorical slots and 5 ordinal steps, in both light and dark mode, pass
  `validate_palette.js` on contrast, chroma floor, CVD adjacent-pair separation and
  normal-vision separation (judged by the script, not by eye).

## Scale honesty in the 3D view

Real proportions are not viewable — Neptune is 30 AU (4.5 billion km) out while Earth is
6,371 km in radius, four orders of magnitude apart. The scene therefore **compresses
distance by √ and size by the 0.4 power**, and says so on the page:

> 距离按平方根、大小按 0.4 次幂压缩显示，非真实比例

Sizes and orbital semi-major axes shown in the preview panel are the *real* values; only the
on-screen geometry is compressed. Planet positions use real sidereal periods and J2000 mean
longitudes, documented as **mean** longitudes — eccentricity and perturbations are not
modelled. The renderer keeps `PointLight.decay = 0`, because under three r155+ physically
correct lighting Neptune would otherwise receive ~1/900 of Earth's light and render as a
black ball.

The 3D view keeps **its own day counter**, seeded from the 2D clock but advanced at its own
rate; the only hand-off is the one-way "sync back to 2D" button, so the 2D timeline is never
dragged along by the 3D one.

## Architecture

```
src/
├─ main.tsx / App.tsx        top-level structure, view switching
├─ data/                     series.ts (74 series) · yax.ts · phases.ts · levels.ts · industries.ts · astro.ts
├─ model/                    math · shape · rhythm · axis · readout · bestday · clock · theme
├─ components/               Controls · BandBar · WaveView · WaveCard · RingView · TableView · FootNote
│  └─ orbit/                 OrbitView · scene.ts · bodies.ts · textures.ts · rates.ts · MiniOrbit · BodyPreview
└─ styles/tokens.css
```

One design decision carries the whole thing: **React owns structure, imperative DOM owns
60 fps.** 74 SVG cards are driven at 60 fps from a single module-level clock and one rAF loop;
subscribers write `setAttribute` / `textContent` directly. `useState` holds only *structural*
change (industry, visible levels, view, table, playing, speed), and each card is `memo`'d so
it never re-renders during animation. Driving that through `setState` would diff 74 subtrees
every frame.

## Data source

`src/data/series.ts` holds 74 series (scale, period, active window, peak, shape function) and
`src/data/yax.ts` the matching axis table. Change a series in one place and the axes, legend,
table, hover and phase ring all follow. `npm run check:data` verifies counts, scale
distribution, industry distribution, that no series falls back to a default axis, and that a
filtered-out series' phase lookup returns `null`.

## Note on the directory name

The repository directory is still `cycle-animation` while `package.json`'s `name` is
`period-atlas` — the mismatch is a leftover: the rename was attempted while the working
directory was locked on it, and `mv` reported "file is in use". **It affects nothing at
runtime**; build, preview and checks are all independent of the directory name.

## Disclaimer

Active windows and peaks are **population-level common ranges**, meant to illustrate rhythm
shapes. They are not medical advice.

## Author

2862440280@qq.com

# TRACE — GPX viewer

A static, client-side GPX viewer. Drop one or more `.gpx` files on the page to plot them on a satellite or terrain basemap. You can then export the current view as a PNG, or the visible routes as a print-sized "Meilenbuch" PDF.

There is no backend, no build step and no npm. Files never leave the browser.

## Running locally

The app uses native ES modules, which browsers won't load from `file://`. Serve the folder over HTTP instead:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Any static server works, for example `npx serve` or the IntelliJ built-in server.

## Project structure

```
index.html              Markup only; loads CSS, the CDN libraries and js/main.js
css/
  base.css              Design tokens (:root), reset, body/#map, reduced-motion
  panel.css             Side panel: dropzone, track list, controls, buttons
  overlays.css          HUD, toast, map drop overlay
  leaflet-theme.css     Overrides for Leaflet's default controls
js/
  main.js               Entry point: runs the init functions
  config.js             Constants: palette, basemaps, distance units, PDF DPI
  state.js              Shared mutable app state + colorOf() / visibleTracks()
  dom.js                $() and bindSegmented() helpers
  format.js             Distance / coordinate / date formatting
  gpx.js                parseGPX(), haversine(), endpoints() (no map access)
  map.js                Leaflet map, basemap switching, track layers, bounds/fit
  ui/
    tracklist.js        Track list rendering, totals, show/hide/remove
    ingest.js           File picker, dropzone, window drag & drop, addFiles()
    controls.js         Display settings and action-button wiring
    hud.js              Live lat/lon/zoom readout
    toast.js            Status messages
  export/
    canvas.js           Offscreen rendering shared by both exports (tiles, tracks, credit)
    png.js              PNG of the current viewport
    pdf.js              Meilenbuch PDF: tight crop, scaled to max mm size, caption
```

### How it fits together

- **State:** `state.js` exports a single `state` object. Code changes it directly and then calls the matching re-render:
  - `rebuildAll()` (map.js) when anything that affects how tracks look changes (color, weight).
  - `renderList()` (ui/tracklist.js) when anything shown in the panel or HUD changes. It also updates the totals and enables or disables the buttons.
- **Libraries:** Leaflet and jsPDF load as classic `<script>` tags from cdnjs, before the app module. They provide the globals `L` and `window.jspdf`. Each tag carries an SRI `integrity` hash, so a changed file on the CDN is refused. Update versions deliberately (see [Updating a CDN library](#updating-a-cdn-library)).
- **Exports:** Both exports redraw the map onto a `<canvas>` instead of taking a screenshot. They fetch tiles at a chosen zoom and project the track points with `map.project()`, so the result matches the screen exactly. For the PDF, tiles are rendered at the lowest zoom that gives enough pixels for 300 DPI. The image is then scaled down, and `lineScale` keeps the line weight visually consistent.
- **Dependency direction:** `config`/`state`/`format`/`gpx` → `map` → `export/*` and `ui/*` → `main`. Keep `gpx.js` and `format.js` free of map and DOM access so they stay easy to test.

## Common changes

**Add a basemap**
1. Add an entry to `TILES` in `js/config.js`. The tile server **must send CORS headers**, or the exports fail with a tainted canvas.
2. Add a `<button data-base="yourKey">` to `#basemapSeg` in `index.html`.

**Add a distance unit**
1. Add an entry to `UNITS` in `js/config.js` (`convert` takes meters).
2. Add a `<button data-unit="yourKey">` to `#unitSeg` in `index.html`.

**Change the look:** colors, fonts and radii are CSS custom properties at the top of `css/base.css`.

### Updating a CDN library

1. Change the version in the `src`/`href` in `index.html`.
2. Replace the `integrity` value with the new file's hash. Copy it from the file's page on cdnjs.com, or compute it:
   ```sh
   echo "sha512-$(curl -sL <url> | openssl dgst -sha512 -binary | base64 -w0)"
   ```
3. Reload and check the console. A wrong hash blocks the library and the map stays blank.

## Security

GPX files are untrusted input, even though they are only processed locally in the viewer's own browser. The rules:

- **Never render file content as HTML.** Track names come from the filename and are written with `textContent`. If you ever display GPX metadata (`<name>`, `<desc>`, …), keep using `textContent`. Leaflet's `bindPopup(string)` / `bindTooltip(string)` insert HTML, so pass them a DOM node instead of a string.
- **Input limits** (`js/config.js`): files over `MAX_FILE_BYTES` (50 MB) are skipped before reading, and parsing stops at `MAX_POINTS` (2 million) per file. Points outside lat ±90 / lon ±180 are dropped in `gpx.js`. Without that, a single bogus coordinate makes the bounds huge and the export tries to render a gigantic canvas.
- **Export limits:** the PDF export refuses source canvases larger than `MAX_EXPORT_PIXELS`, and `drawTiles` refuses to fetch more than `MAX_EXPORT_TILES` tiles.
- **XML parsing** uses the browser's `DOMParser`, which never loads external entities (no XXE) and limits entity expansion.
- **Third-party code** is pinned by version and SRI hash (see above).

**Privacy:** GPX files often reveal home or work locations. Nothing is uploaded, and the PNG/PDF exports contain no GPS metadata. The only outbound requests are the map tiles fetched from Esri, which reveal the area being viewed.

## Deployment

The site is deployed with GitHub Pages straight from the repository root on `main`. Every push goes live, and there is nothing to build. `.nojekyll` stops Pages from running Jekyll over the files. Keep it.

All paths in `index.html` and the JS imports are relative, so the site also works under the `/<repo-name>/` sub-path that Pages uses.

## Browser support

The app targets current evergreen browsers. It relies on ES modules, `Array.from`, object spread and `Promise.prototype.finally`.

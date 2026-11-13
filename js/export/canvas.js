// Offscreen canvas rendering shared by PNG and PDF export.
// Everything is drawn in Leaflet world-pixel coordinates at zoom z, offset by `min`
// (the world-pixel position of the canvas' top-left corner).
import { TILES } from '../config.js';
import { state, colorOf } from '../state.js';
import { map } from '../map.js';
import { endpoints } from '../gpx.js';

const TILE_SIZE = 256;

function loadTile(url){
  return new Promise(res => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null); // missing tile -> leave background
    img.src = url;
  });
}

// Draws basemap tiles covering [min, min + W/H) at zoom z into ctx
export function drawTiles(ctx, z, min, W, H, tmpl){
  const maxTile = 2 ** z;
  const x0 = Math.floor(min.x / TILE_SIZE), x1 = Math.floor((min.x + W) / TILE_SIZE);
  const y0 = Math.floor(min.y / TILE_SIZE), y1 = Math.floor((min.y + H) / TILE_SIZE);
  const jobs = [];
  for(let tx = x0; tx <= x1; tx++){
    for(let ty = y0; ty <= y1; ty++){
      if(ty < 0 || ty >= maxTile) continue;
      const wrapX = ((tx % maxTile) + maxTile) % maxTile;
      const url = tmpl.replace('{z}', z).replace('{x}', wrapX).replace('{y}', ty);
      const px = tx * TILE_SIZE, py = ty * TILE_SIZE;
      jobs.push(loadTile(url).then(img => {
        if(img) ctx.drawImage(img, Math.round(px - min.x), Math.round(py - min.y), TILE_SIZE, TILE_SIZE);
      }));
    }
  }
  return Promise.all(jobs);
}

function marker(ctx, p, min, col, isStart, scale){
  const x = p.x - min.x, y = p.y - min.y;
  ctx.beginPath(); ctx.arc(x, y, 5 * scale, 0, Math.PI * 2);
  if(isStart){ ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2 * scale; ctx.strokeStyle = '#fff'; ctx.stroke(); }
  else{ ctx.fillStyle = '#0c1116'; ctx.fill(); ctx.lineWidth = 3 * scale; ctx.strokeStyle = col; ctx.stroke(); }
}

// Draws all visible tracks. lineScale compensates for rendering at a resolution that
// is later scaled down, so the final line weight matches the on-screen weight.
export function drawTracksToCtx(ctx, z, min, lineScale = 1){
  for(const t of state.tracks){
    if(!t.visible) continue;
    const col = colorOf(t);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = col; ctx.lineWidth = state.weight * lineScale;
    for(const seg of t.segments){
      if(seg.length < 2) continue;
      ctx.beginPath();
      seg.forEach((ll, i) => {
        const p = map.project(ll, z); // Leaflet's own projection, so it matches the screen
        const x = p.x - min.x, y = p.y - min.y;
        if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    const [first, last] = endpoints(t.segments);
    marker(ctx, map.project(first, z), min, col, true, lineScale);
    marker(ctx, map.project(last, z), min, col, false, lineScale);
  }
}

// Imagery attribution in the bottom-right corner (required by the tile provider)
export function burnCredit(ctx, W, H){
  const credit = TILES[state.basemap].attr;
  ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
  const tw = ctx.measureText(credit).width;
  ctx.fillStyle = 'rgba(8,12,16,.66)'; ctx.fillRect(W - tw - 16, H - 24, tw + 16, 24);
  ctx.fillStyle = 'rgba(220,228,235,.85)'; ctx.textBaseline = 'middle';
  ctx.fillText(credit, W - tw - 8, H - 11);
}

// Disables a button and shows "…" while fn's promise runs; restores it afterwards
export function withBusyButton(btn, fn){
  const label = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '…';
  return Promise.resolve().then(fn).finally(() => { btn.disabled = false; btn.innerHTML = label; });
}

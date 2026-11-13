// Meilenbuch PDF export: visible routes cropped tight and scaled to fit a fixed
// print size (mm), with a date/distance caption. Uses the global jsPDF (window.jspdf).
import { TILES, PDF_DPI } from '../config.js';
import { state, visibleTracks } from '../state.js';
import { map, combinedBounds } from '../map.js';
import { fmtDistText, fmtDate } from '../format.js';
import { toast } from '../ui/toast.js';
import { $ } from '../dom.js';
import { drawTiles, drawTracksToCtx, burnCredit, withBusyButton } from './canvas.js';

const mm2px = mm => Math.round(mm / 25.4 * PDF_DPI);
const px2mm = px => px / PDF_DPI * 25.4;

// "01.06.2026 – 03.06.2026   ·   123 km" (date part omitted when tracks have no timestamps)
function captionLine(tracks, dist){
  const starts = tracks.map(t => t.startTime).filter(Boolean);
  const ends = tracks.map(t => t.endTime).filter(Boolean);
  let dateStr = '';
  if(starts.length && ends.length){
    const minD = new Date(Math.min(...starts));
    const maxD = new Date(Math.max(...ends));
    dateStr = minD.toDateString() === maxD.toDateString() ? fmtDate(minD) : fmtDate(minD) + ' – ' + fmtDate(maxD);
  }
  return [dateStr, fmtDistText(dist)].filter(Boolean).join('   ·   ');
}

// Output image size in px: fits maxW x maxH while keeping the bounds' aspect ratio
function outputSize(padded, maxWpx, maxHpx){
  const nw0 = map.project(padded.getNorthWest(), 0), se0 = map.project(padded.getSouthEast(), 0);
  const bw0 = se0.x - nw0.x, bh0 = se0.y - nw0.y;
  const boundsAR = (bw0 > 0 && bh0 > 0) ? bw0 / bh0 : 1;
  let outW, outH;
  if(boundsAR > maxWpx / maxHpx){ outW = maxWpx; outH = Math.round(maxWpx / boundsAR); }
  else{ outH = maxHpx; outW = Math.round(maxHpx * boundsAR); }
  return { outW: Math.max(1, outW), outH: Math.max(1, outH) };
}

// Lowest integer tile zoom giving at least outW x outH source pixels (avoids upscale blur)
function pickZoom(padded, outW, outH, maxZoom){
  let z, nw, se;
  for(z = 0; z <= maxZoom; z++){
    nw = map.project(padded.getNorthWest(), z); se = map.project(padded.getSouthEast(), z);
    if(se.x - nw.x >= outW && se.y - nw.y >= outH) break;
  }
  if(z > maxZoom) z = maxZoom; // last iteration (at maxZoom) already computed nw/se
  return { z, min: nw, srcW: se.x - nw.x, srcH: se.y - nw.y };
}

export function exportPDF(){
  const visible = visibleTracks();
  let bounds = combinedBounds();
  if(!visible.length || !bounds.isValid()){ toast('No visible tracks to export.', true); return; }
  if(typeof window.jspdf === 'undefined'){ toast('PDF library failed to load.', true); return; }

  const maxWmm = Math.max(20, parseFloat($('pdfWidth').value) || 80);
  const maxHmm = Math.max(20, parseFloat($('pdfHeight').value) || 60);

  const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
  if(sw.lat === ne.lat && sw.lng === ne.lng){ // single point — give it a footprint
    bounds = L.latLngBounds([sw.lat - 0.005, sw.lng - 0.005], [ne.lat + 0.005, ne.lng + 0.005]);
  }
  const padded = bounds.pad(0.10);

  const { outW, outH } = outputSize(padded, mm2px(maxWmm), mm2px(maxHmm));
  const { z, min, srcW, srcH } = pickZoom(padded, outW, outH, TILES[state.basemap].max);
  const k = Math.min(outW / srcW, outH / srcH);   // downscale factor applied at the end
  const lineScale = k > 0 ? 1 / k : 1;

  return withBusyButton($('exportPdfBtn'), () => {
    const src = document.createElement('canvas');
    src.width = Math.round(srcW); src.height = Math.round(srcH);
    const sctx = src.getContext('2d');
    sctx.fillStyle = '#0c1116'; sctx.fillRect(0, 0, src.width, src.height);

    return drawTiles(sctx, z, min, src.width, src.height, TILES[state.basemap].url).then(() => {
      drawTracksToCtx(sctx, z, min, lineScale);
      burnCredit(sctx, src.width, src.height);

      const out = document.createElement('canvas');
      out.width = outW; out.height = outH;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      octx.drawImage(src, 0, 0, src.width, src.height, 0, 0, outW, outH);

      const outWmm = px2mm(outW), outHmm = px2mm(outH);
      const margin = 6, captionH = 8;
      const doc = new window.jspdf.jsPDF({ unit:'mm', format:[outWmm + margin*2, outHmm + margin*2 + captionH] });
      const dist = visible.reduce((s, t) => s + t.distance, 0);
      doc.setProperties({ title:'Meilenbuch' });
      doc.addImage(out.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, outWmm, outHmm);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(40, 40, 40);
      doc.text(captionLine(visible, dist), margin, margin + outHmm + 5.5, { maxWidth: outWmm });

      doc.save('meilenbuch-' + new Date().toISOString().slice(0, 10) + '.pdf');
      toast('PDF exported · ' + outWmm.toFixed(0) + '×' + outHmm.toFixed(0) + ' mm');
    }).catch(() => toast('Export failed while loading imagery.', true));
  });
}

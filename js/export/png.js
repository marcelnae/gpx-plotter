// PNG export: exactly the current map viewport.
import { TILES } from '../config.js';
import { state } from '../state.js';
import { map } from '../map.js';
import { toast } from '../ui/toast.js';
import { $ } from '../dom.js';
import { drawTiles, drawTracksToCtx, burnCredit, withBusyButton } from './canvas.js';

export function downloadBlob(blob, filename){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function exportPNG(){
  return withBusyButton($('exportBtn'), () => {
    const z = Math.round(map.getZoom());
    const size = map.getSize();             // css px
    const min = map.getPixelBounds().min;   // world px @ current zoom
    const W = size.x, H = size.y;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0c1116'; ctx.fillRect(0, 0, W, H);

    return drawTiles(ctx, z, min, W, H, TILES[state.basemap].url)
      .then(() => {
        drawTracksToCtx(ctx, z, min, 1);
        burnCredit(ctx, W, H);
        return new Promise(res => canvas.toBlob(res, 'image/png'));
      })
      .then(blob => {
        if(!blob){ toast('Export failed — imagery blocked the canvas.', true); return; }
        downloadBlob(blob, 'trace-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.png');
        toast('PNG exported · ' + W + '×' + H);
      })
      .catch(() => toast('Export failed while loading imagery.', true));
  });
}

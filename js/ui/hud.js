// Bottom-left HUD: live cursor position and zoom. (Total distance is set by refreshTotals.)
import { map } from '../map.js';
import { fmtDeg } from '../format.js';
import { $ } from '../dom.js';

export function initHud(){
  map.on('mousemove', e => {
    $('hudLat').textContent = fmtDeg(e.latlng.lat, true);
    $('hudLon').textContent = fmtDeg(e.latlng.lng, false);
  });
  map.on('mouseout', () => { $('hudLat').textContent = '—'; $('hudLon').textContent = '—'; });
  map.on('zoomend', () => { $('hudZoom').textContent = Math.round(map.getZoom()); });
}

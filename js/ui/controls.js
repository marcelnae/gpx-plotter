// Display settings and action buttons in the side panel.
import { state } from '../state.js';
import { setBasemap, rebuildAll, fitToVisible } from '../map.js';
import { renderList } from './tracklist.js';
import { exportPNG } from '../export/png.js';
import { exportPDF } from '../export/pdf.js';
import { $, bindSegmented } from '../dom.js';

export function initControls(){
  bindSegmented($('unitSeg'), b => {
    state.distanceUnit = b.dataset.unit;
    renderList();
  });

  bindSegmented($('basemapSeg'), b => setBasemap(b.dataset.base));

  bindSegmented($('colorSeg'), b => {
    state.colorMode = b.dataset.mode;
    $('uniformWrap').style.display = state.colorMode === 'uniform' ? 'block' : 'none';
    rebuildAll(); renderList();
  });

  $('uniformColor').addEventListener('input', e => {
    state.uniformColor = e.target.value;
    $('uniformHex').textContent = e.target.value.toUpperCase();
    if(state.colorMode === 'uniform'){ rebuildAll(); renderList(); }
  });

  $('weight').addEventListener('input', e => {
    state.weight = parseInt(e.target.value, 10);
    $('weightVal').textContent = e.target.value + 'px';
    rebuildAll();
  });

  $('fitBtn').onclick = fitToVisible;
  $('exportBtn').onclick = exportPNG;
  $('exportPdfBtn').onclick = exportPDF;

  // collapse panel on mobile
  $('togglePanel').onclick = () => $('console').classList.toggle('collapsed');
}

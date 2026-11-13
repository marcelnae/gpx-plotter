// Track list in the side panel, plus the totals/button states derived from it.
import { state, colorOf } from '../state.js';
import { showLayer } from '../map.js';
import { fmtDistText, fmtDistHTML } from '../format.js';
import { $ } from '../dom.js';

const REMOVE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// Updates HUD distance, track count and which action buttons are enabled
export function refreshTotals(){
  let d = 0, anyVisible = false;
  for(const t of state.tracks) if(t.visible){ d += t.distance; anyVisible = true; }
  $('hudDist').innerHTML = fmtDistHTML(d);
  $('fitBtn').disabled = !anyVisible;
  $('exportBtn').disabled = !state.tracks.length;
  $('exportPdfBtn').disabled = !anyVisible;
  $('count').textContent = state.tracks.length;
}

export function renderList(){
  const list = $('tracklist');
  list.innerHTML = '';
  if(!state.tracks.length){
    const e = document.createElement('div');
    e.className = 'empty';
    e.textContent = 'No tracks loaded. Add GPX files to plot them.';
    list.appendChild(e);
  }
  for(const t of state.tracks) list.appendChild(trackRow(t));
  refreshTotals();
}

function trackRow(t){
  const row = document.createElement('div');
  row.className = 'row' + (t.visible ? '' : ' off');

  const sw = document.createElement('button');
  sw.className = 'swatch';
  sw.style.background = colorOf(t);
  sw.title = 'Show / hide';
  sw.setAttribute('aria-label', 'Toggle ' + t.name);
  sw.onclick = () => toggleVisible(t);

  const meta = document.createElement('div'); meta.className = 'meta';
  const fn = document.createElement('div'); fn.className = 'fname'; fn.textContent = t.name; fn.title = t.name;
  const st = document.createElement('div'); st.className = 'fstat';
  st.textContent = fmtDistText(t.distance) + ' · ' + t.points.toLocaleString() + ' pts';
  meta.append(fn, st);

  const del = document.createElement('button');
  del.className = 'del';
  del.setAttribute('aria-label', 'Remove ' + t.name);
  del.innerHTML = REMOVE_ICON;
  del.onclick = () => removeTrack(t);

  row.append(sw, meta, del);
  return row;
}

function toggleVisible(t){
  t.visible = !t.visible;
  showLayer(t, t.visible);
  renderList();
}

function removeTrack(t){
  showLayer(t, false);
  state.tracks = state.tracks.filter(x => x !== t);
  renderList();
}

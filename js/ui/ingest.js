// Loading GPX files: file picker, dropzone and window-wide drag & drop.
import { PALETTE, MAX_FILE_BYTES } from '../config.js';
import { state } from '../state.js';
import { parseGPX } from '../gpx.js';
import { buildLayer, fitToVisible } from '../map.js';
import { renderList } from './tracklist.js';
import { toast } from './toast.js';
import { $ } from '../dom.js';

export function addFiles(fileList){
  const gpxFiles = Array.from(fileList).filter(f => /\.gpx$/i.test(f.name));
  if(!gpxFiles.length){ toast('Those weren’t .gpx files.', true); return; }

  // Oversized files are skipped before reading so they can't exhaust memory
  const files = gpxFiles.filter(f => f.size <= MAX_FILE_BYTES);
  const tooLarge = gpxFiles.length - files.length;
  if(!files.length){ toast('Files over ' + (MAX_FILE_BYTES / 1048576) + ' MB are not supported.', true); return; }

  let loaded = 0, failed = tooLarge, pending = files.length;
  const done = () => {
    renderList();
    if(loaded) fitToVisible();
    if(loaded && !failed) toast(loaded + ' track' + (loaded > 1 ? 's' : '') + ' loaded');
    else if(loaded && failed) toast(loaded + ' loaded · ' + failed + ' skipped', true);
    else toast('Could not read those files.', true);
  };

  for(const f of files){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = parseGPX(reader.result);
        const t = {
          id: ++state.seq,
          name: f.name.replace(/\.gpx$/i, ''),
          color: PALETTE[state.seq % PALETTE.length],
          visible: true,
          ...data,
          group: null
        };
        state.tracks.push(t);
        buildLayer(t);
        loaded++;
      }catch(err){ failed++; }
      if(--pending === 0) done();
    };
    reader.onerror = () => { failed++; if(--pending === 0) done(); };
    reader.readAsText(f);
  }
}

export function initIngest(){
  const drop = $('drop'), fileInput = $('file'), mapdrop = $('mapdrop');

  drop.onclick = () => fileInput.click();
  drop.onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fileInput.click(); } };
  fileInput.onchange = () => { if(fileInput.files.length) addFiles(fileInput.files); fileInput.value = ''; };

  // drag & drop over the whole window; dragDepth counts nested enter/leave events
  let dragDepth = 0;
  const setHot = on => { mapdrop.classList.toggle('show', on); drop.classList.toggle('hot', on); };
  window.addEventListener('dragenter', e => { e.preventDefault(); dragDepth++; setHot(true); });
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('dragleave', e => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if(!dragDepth) setHot(false);
  });
  window.addEventListener('drop', e => {
    e.preventDefault(); dragDepth = 0; setHot(false);
    if(e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });
}

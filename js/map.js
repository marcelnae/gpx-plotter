// The live Leaflet map and the track layers drawn on it.
import { TILES, FIT_PAD } from './config.js';
import { state, colorOf } from './state.js';
import { endpoints } from './gpx.js';

export const map = L.map('map', { preferCanvas:true, worldCopyJump:true, zoomControl:true, zoomSnap:1, attributionControl:true })
  .setView([20, 0], 2);
const canvasRenderer = L.canvas({ padding:0.5 });

function tileLayer(key){
  const t = TILES[key];
  return L.tileLayer(t.url, { crossOrigin:'anonymous', maxZoom:t.max, attribution:t.attr });
}

let baseLayer = tileLayer(state.basemap).addTo(map);
L.control.scale({ imperial:true, metric:true, position:'bottomright' }).addTo(map);

export function setBasemap(key){
  if(key === state.basemap) return;
  state.basemap = key;
  map.removeLayer(baseLayer);
  baseLayer = tileLayer(key).addTo(map);
  baseLayer.bringToBack();
}

// Creates t.group (polylines + start/end markers) and adds it to the map if visible
export function buildLayer(t){
  const group = L.layerGroup();
  const col = colorOf(t);
  for(const seg of t.segments){
    if(seg.length > 1){
      L.polyline(seg, { color:col, weight:state.weight, opacity:0.95, lineJoin:'round', lineCap:'round', renderer:canvasRenderer }).addTo(group);
    }
  }
  const [first, last] = endpoints(t.segments);
  L.circleMarker(first, { radius:5, color:'#fff', weight:2, fillColor:col, fillOpacity:1, renderer:canvasRenderer }).addTo(group);
  L.circleMarker(last,  { radius:5, color:col, weight:3, fillColor:'#0c1116', fillOpacity:1, renderer:canvasRenderer }).addTo(group);
  t.group = group;
  if(t.visible) group.addTo(map);
}

// Rebuild every track layer, e.g. after a color or line weight change
export function rebuildAll(){
  for(const t of state.tracks){
    if(t.group) map.removeLayer(t.group);
    buildLayer(t);
  }
}

export function showLayer(t, show){
  if(!t.group) return;
  if(show) t.group.addTo(map); else map.removeLayer(t.group);
}

export function combinedBounds(){
  const b = L.latLngBounds([]);
  for(const t of state.tracks) if(t.visible) b.extend(t.bounds);
  return b;
}

export function fitToVisible(){
  const b = combinedBounds();
  if(b.isValid()) map.fitBounds(b.pad(FIT_PAD));
}

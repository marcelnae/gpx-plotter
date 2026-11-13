// GPX parsing and geo math. No DOM (apart from DOMParser) and no map access.

// Great-circle distance in meters between [lat, lon] pairs
export function haversine(a, b){
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  const la1 = a[0] * rad, la2 = b[0] * rad;
  const h = Math.sin(dLat/2) ** 2 + Math.sin(dLon/2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// First point of the first segment and last point of the last segment
export function endpoints(segments){
  const lastSeg = segments[segments.length - 1];
  return [segments[0][0], lastSeg[lastSeg.length - 1]];
}

function readPoints(nodes){
  const pts = [];
  for(const n of nodes){
    const lat = parseFloat(n.getAttribute('lat')), lon = parseFloat(n.getAttribute('lon'));
    if(isFinite(lat) && isFinite(lon)) pts.push([lat, lon]);
  }
  return pts;
}

function readTime(node){
  const els = node.getElementsByTagName('time');
  if(!els.length) return null;
  const d = new Date(els[0].textContent.trim());
  return isNaN(d.getTime()) ? null : d;
}

// GPX text -> { segments, points, distance, bounds, startTime, endTime }
// segments: array of [[lat, lon], ...]. Throws if there is nothing to plot.
export function parseGPX(text){
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if(doc.getElementsByTagName('parsererror').length) throw new Error('not valid XML');

  const segments = [];
  // track segments
  for(const seg of doc.getElementsByTagName('trkseg')){
    const p = readPoints(seg.getElementsByTagName('trkpt'));
    if(p.length) segments.push(p);
  }
  // routes
  for(const rte of doc.getElementsByTagName('rte')){
    const p = readPoints(rte.getElementsByTagName('rtept'));
    if(p.length) segments.push(p);
  }
  // waypoints only (no tracks/routes) -> one segment so they still render
  if(!segments.length){
    const wpts = readPoints(doc.getElementsByTagName('wpt'));
    if(wpts.length) segments.push(wpts);
  }
  if(!segments.length) throw new Error('no track, route or waypoint data');

  let distance = 0, points = 0;
  const bounds = L.latLngBounds([]);
  for(const seg of segments){
    for(let j = 0; j < seg.length; j++){
      bounds.extend(seg[j]); points++;
      if(j > 0) distance += haversine(seg[j-1], seg[j]);
    }
  }

  // best-effort start/end time, for the Meilenbuch caption
  let startTime = null, endTime = null;
  const trkpts = doc.getElementsByTagName('trkpt');
  if(trkpts.length){
    startTime = readTime(trkpts[0]);
    endTime = readTime(trkpts[trkpts.length - 1]);
  }
  return { segments, points, distance, bounds, startTime, endTime };
}

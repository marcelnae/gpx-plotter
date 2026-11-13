// Display formatting. Pure apart from reading the selected distance unit.
import { UNITS } from './config.js';
import { state } from './state.js';

export function unitAbbr(){
  return UNITS[state.distanceUnit].abbr;
}

// meters -> "12.3" in the selected unit
export function fmtDist(m){
  const unit = UNITS[state.distanceUnit];
  const val = unit.convert(m);
  return val.toFixed(unit.decimals(val));
}

// meters -> "12.3 km"
export function fmtDistText(m){
  return fmtDist(m) + ' ' + unitAbbr();
}

// meters -> '12.3 <span class="u">km</span>' (for the HUD)
export function fmtDistHTML(m){
  return fmtDist(m) + ' <span class="u">' + unitAbbr() + '</span>';
}

// decimal degrees -> 048° 08' 12.34" N
export function fmtDeg(v, isLat){
  const h = isLat ? (v >= 0 ? 'N' : 'S') : (v >= 0 ? 'E' : 'W');
  const absv = Math.abs(v);
  const pad = isLat ? 2 : 3; // latitude: 0-90, longitude: 0-180
  const deg = Math.floor(absv);
  const min = (absv - deg) * 60;
  const sec = (min - Math.floor(min)) * 60;
  return String(deg).padStart(pad, '0') + '° '
       + String(Math.floor(min)).padStart(2, '0') + "' "
       + sec.toFixed(2).padStart(5, '0') + '" ' + h;
}

export function fmtDate(d){
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
}

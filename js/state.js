// Single shared, mutable app state. Modules import it and change it directly;
// whoever changes it is responsible for calling the matching re-render
// (rebuildAll() for the map, renderList() for the panel).

export const state = {
  // { id, name, color, visible, segments, points, distance, bounds, startTime, endTime, group }
  tracks: [],
  seq: 0,
  colorMode: 'perfile',   // 'perfile' | 'uniform'
  uniformColor: '#ff6a1a',
  basemap: 'sat',         // key of TILES
  weight: 3,              // line weight in px
  distanceUnit: 'km'      // key of UNITS
};

export function colorOf(t){
  return state.colorMode === 'uniform' ? state.uniformColor : t.color;
}

export function visibleTracks(){
  return state.tracks.filter(t => t.visible);
}

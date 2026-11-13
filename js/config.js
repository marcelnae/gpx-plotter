// Static configuration. No DOM or Leaflet access here.

export const PALETTE = ['#ff4d4f','#18e0c8','#ffc233','#b366ff','#4d9bff','#ff7ac6','#7cff4d','#ff8a3d','#ff5d9e','#5ad1ff'];

// Basemaps. `url` must allow CORS (crossOrigin:'anonymous'), otherwise PNG/PDF export taints the canvas.
export const TILES = {
  sat:  { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attr:'Imagery © Esri, Maxar, Earthstar Geographics', max:19 },
  terr: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attr:'© Esri — World Topographic Map', max:19 }
};

// Fewer decimals as the number grows: 1.23 / 12.3 / 123
function decimalsFor(v){ if(v < 10) return 2; if(v < 100) return 1; return 0; }

// Distance units: convert(meters) -> value in that unit; decimals(value) -> digits to show
export const UNITS = {
  km: { label:'Kilometer',    abbr:'km', convert: m => m / 1000,    decimals: decimalsFor },
  mi: { label:'Miles',        abbr:'mi', convert: m => m / 1609.34, decimals: decimalsFor },
  nm: { label:'Nautic Miles', abbr:'nm', convert: m => m / 1852,    decimals: decimalsFor }
};

// Padding around tracks when fitting the map view (fraction of bounds)
export const FIT_PAD = 0.12;

// Resolution of the Meilenbuch PDF image
export const PDF_DPI = 300;

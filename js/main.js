// Entry point. Importing map.js creates the Leaflet map; the rest wires up the UI.
import { initIngest } from './ui/ingest.js';
import { initControls } from './ui/controls.js';
import { initHud } from './ui/hud.js';
import { renderList } from './ui/tracklist.js';

initIngest();
initControls();
initHud();
renderList(); // initial empty state + button states

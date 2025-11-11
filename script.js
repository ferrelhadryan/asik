

function normalizeTemp(t) {
  if (t < 24) return 0.4;
  if (t <= 30) return 1.0;
  if (t <= 34) return 0.6;
  return 0.2;
}

function normalizeChl(chl) {
  if (chl < 0.3) return 0.4;
  if (chl <= 1.5) return 1.0;
  return 0.5;
}

function normalizeSalinity(s) {
  if (s < 28) return 0.3;
  if (s <= 35) return 1.0;
  return 0.6;
}

function normalizeCurrent(c) {
  if (c < 0.2) return 0.8;
  if (c <= 0.5) return 1.0;
  return 0.4;
}

function normalizeDepth(d) {
  if (d < 10) return 0.4;
  if (d <= 100) return 1.0;
  return 0.6;
}

function computeSuitability(props) {
  const score = (
    0.25 * normalizeTemp(props.surface_temp) +
    0.2 * normalizeChl(props.chl_a) +
    0.2 * normalizeSalinity(props.salinity) +
    0.15 * normalizeCurrent(props.current_speed) +
    0.2 * normalizeDepth(props.depth)
  );

  let kategori = "Tidak Cocok";
  if (score >= 0.7) kategori = "Cocok";
  else if (score >= 0.5) kategori = "Kurang Cocok";
  return { score, kategori };
}

function getColor(kat) {
  return kat === "Cocok" ? "#28a745" :
         kat === "Kurang Cocok" ? "#ffc107" : "#dc3545";
}

const map = L.map("map", {
  minZoom: 11, // prevent zooming out too far
});

// get the bounds of all data
const allDataBounds = L.geoJSON(suitabilityData).getBounds();
if (allDataBounds.isValid()) {
  map.fitBounds(allDataBounds.pad(0.1)); // fit to all data with padding
  map.setMaxBounds(allDataBounds.pad(0.5)); // restrict panning
}


const basemapOSM = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap" });
const basemapEsri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Tiles © Esri' });
let currentBasemap = 'osm';
basemapOSM.addTo(map);

// utility: download file
function downloadFile(filename, content){
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// info panel handling
const infoPanel = document.getElementById('info-panel');
const infoContent = document.getElementById('info-content');
const infoClose = document.getElementById('info-close');
const infoPin = document.getElementById('info-pin');
const favoritesListEl = document.getElementById('favorites-list');
const clearFavoritesBtn = document.getElementById('clear-favorites');
const toastContainer = document.getElementById('toast-container');

let infoPinned = false;
if (infoClose) infoClose.addEventListener('click', ()=> { infoPanel.setAttribute('aria-hidden','true'); });
if (infoPin) infoPin.addEventListener('click', ()=>{
  infoPinned = !infoPinned;
  infoPin.setAttribute('aria-pressed', String(infoPinned));
  showToast(infoPinned ? 'Info dipin' : 'Info unpin');
});

// favorites management
const FAVORITES_KEY = 'rs_favorites_v1';
let favorites = [];
function loadFavorites(){
  try{ favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
  catch(e){ favorites = []; }
  renderFavorites();
}
function saveFavorites(){ localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); renderFavorites(); }
function renderFavorites(){
  if (!favoritesListEl) return;
  favoritesListEl.innerHTML = '';
  favorites.forEach((f, idx)=>{
    const li = document.createElement('li');
    li.textContent = f.name || f;
    const btn = document.createElement('button'); btn.textContent='✕'; btn.title='Hapus favorit'; btn.addEventListener('click', ()=>{ favorites.splice(idx,1); saveFavorites(); showToast('Dihapus dari favorit'); });
    li.appendChild(btn);
    favoritesListEl.appendChild(li);
  });
}
if (clearFavoritesBtn) clearFavoritesBtn.addEventListener('click', ()=>{ favorites = []; saveFavorites(); showToast('Semua favorit dihapus'); });
loadFavorites();

function addFavorite(props){
  if (!props || !props.name) return;
  if (favorites.find(f=>f.name === props.name)) { showToast('Sudah ada di favorit'); return; }
  favorites.push({ name: props.name, props }); saveFavorites(); showToast('Ditambahkan ke favorit');
}

function showToast(msg, ms=2400){
  if (!toastContainer) return;
  const t = document.createElement('div'); t.className='toast'; t.textContent = msg; toastContainer.appendChild(t);
  setTimeout(()=> t.classList.add('show'), 40);
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=> t.remove(), 200); }, ms);
}

// show info: respects pin state unless forced
function showInfo(props, force=false){
  if (!infoPanel || !infoContent) return; // no info panel in this layout
  if (infoPinned && !force) return; // do not override when pinned
  const { score, kategori } = computeSuitability(props);
  const pct = Math.round(score * 100);
  const isFav = favorites.find(f=>f.name === props.name);
  infoContent.innerHTML = `
    <h3>${props.name}</h3>
    <div style="margin:6px 0"><strong>Kategori:</strong> ${kategori} — <strong>Skor:</strong> ${score.toFixed(2)} (${pct}%)</div>
    <div style="height:8px;background:rgba(0,0,0,0.06);border-radius:6px;overflow:hidden;margin-bottom:8px">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#06b6d4,#7c3aed);"></div>
    </div>
    <ul style="padding-left:18px;margin:6px 0 0 0">
      <li>Suhu: ${props.surface_temp} °C</li>
      <li>Klorofil-a: ${props.chl_a} mg/m³</li>
      <li>Salinitas: ${props.salinity} PSU</li>
      <li>Arus: ${props.current_speed} m/s</li>
      <li>Kedalaman: ${props.depth} m</li>
    </ul>
    <div style="margin-top:10px;display:flex;gap:8px">
      <button id="btn-focus" class="btn">Focus</button>
      <button id="btn-download-prop" class="btn btn-ghost">Download</button>
      <button id="btn-favorite" class="btn">${isFav ? '★ Favorit' : '☆ Favorit'}</button>
    </div>
  `;
  infoPanel.setAttribute('aria-hidden','false');
  // wire small buttons
  const btnFocus = document.getElementById('btn-focus');
  if (btnFocus) btnFocus.addEventListener('click', ()=>{ if (props._layer) map.fitBounds(props._layer.getBounds().pad(0.08)); });
  const btnDownload = document.getElementById('btn-download-prop');
  if (btnDownload) btnDownload.addEventListener('click', ()=>{
    const rows = [['key','value']];
    Object.keys(props).forEach(k=> rows.push([k, String(props[k])]));
    downloadFile((props.name||'feature') + '-props.csv', rows.map(r=>r.map(c=>`"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n'));
  });
  const btnFav = document.getElementById('btn-favorite');
  if (btnFav) btnFav.addEventListener('click', ()=>{ if (favorites.find(f=>f.name===props.name)){ favorites = favorites.filter(f=>f.name!==props.name); saveFavorites(); btnFav.textContent='☆ Favorit'; } else { addFavorite(props); btnFav.textContent='★ Favorit'; } });
}

// style & interactions for GeoJSON
let geojsonLayer = null;
function styleFor(feature){
  const { kategori } = computeSuitability(feature.properties);
  return { color: getColor(kategori), fillColor: getColor(kategori), weight: 1, fillOpacity: 0.62 };
}

function highlightFeature(e){
  const layer = e.target;
  layer.setStyle({ weight: 2.8, fillOpacity: 0.9 });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) layer.bringToFront();
}

function resetHighlight(e){
  geojsonLayer.resetStyle(e.target);
}

function zoomToFeature(e){
  map.fitBounds(e.target.getBounds().pad(0.08));
  showInfo(e.target.feature.properties);
}

function onEach(feature, layer){
  const p = feature.properties;
  // attach reference for info focus
  p._layer = layer;
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
  layer.bindTooltip(p.name, {direction:'top'});
  const { score, kategori } = computeSuitability(p);
  // remove automatic popup to avoid cluttering the center of the map
  // layer.bindPopup(`<b>${p.name}</b><br/>Kategori: ${kategori}<br/>Skor: ${score.toFixed(2)}`);
}

geojsonLayer = L.geoJSON(suitabilityData, { style: styleFor, onEachFeature: onEach }).addTo(map);

// controls
const btnBasemap = document.getElementById('btn-basemap');
const btnReset = document.getElementById('btn-reset');
const btnExport = document.getElementById('btn-export');
const btnExportGeo = document.getElementById('btn-export-geo');
const searchInput = document.getElementById('search-input');
const scoreFilter = document.getElementById('score-filter');

if (btnBasemap) btnBasemap.addEventListener('click', ()=>{
  if (currentBasemap === 'osm'){ map.removeLayer(basemapOSM); basemapEsri.addTo(map); currentBasemap='esri'; btnBasemap.textContent='🗺️ Imagery'; }
  else { map.removeLayer(basemapEsri); basemapOSM.addTo(map); currentBasemap='osm'; btnBasemap.textContent='🗺️ Map'; }
});

if (btnReset) btnReset.addEventListener('click', ()=> map.fitBounds(allDataBounds.pad(0.1)));

if (btnExport) btnExport.addEventListener('click', ()=>{
  const rows = [['name','kategori','score','surface_temp','chl_a','salinity','current_speed','depth']];
  suitabilityData.features.forEach(f=>{ const p=f.properties; const { score,kategori } = computeSuitability(p); rows.push([p.name,kategori,score.toFixed(3),p.surface_temp,p.chl_a,p.salinity,p.current_speed,p.depth]); });
  const csv = rows.map(r=>r.map(c=>`"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadFile('suitability-export.csv', csv);
});

// export visible GeoJSON (after filtering)
if (btnExportGeo) btnExportGeo.addEventListener('click', ()=>{
  const features = [];
  geojsonLayer.eachLayer(l=>{ if (map.hasLayer(l) && l.feature) features.push(l.feature); });
  const fc = { type: 'FeatureCollection', features };
  const blob = new Blob([JSON.stringify(fc)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'visible-features.geojson'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('GeoJSON diunduh');
});

// search: find by name and zoom
if (searchInput){
  searchInput.addEventListener('keydown', (e)=>{ if (e.key === 'Enter'){ const q = searchInput.value.trim().toLowerCase(); if (!q) return; const found = suitabilityData.features.find(f=> (f.properties.name||'').toLowerCase().includes(q)); if (found){ const layer = found.properties._layer; if (layer) map.fitBounds(layer.getBounds().pad(0.08)); showInfo(found.properties); } } });
}

// filter slider: show only features with score >= threshold
function applyFilter(threshold){
  let shown = 0;
  geojsonLayer.eachLayer(l=>{
    try{
      const p = l.feature && l.feature.properties;
      if (!p) return;
      const s = Math.round(computeSuitability(p).score * 100);
      if (s < threshold){ if (map.hasLayer(l)) map.removeLayer(l); }
      else { if (!map.hasLayer(l)) l.addTo(map); shown++; }
    } catch(e) { /* ignore */ }
  });
  return shown;
}

if (scoreFilter){
  // update map live while sliding; do not spam toasts on each input
  scoreFilter.addEventListener('input', ()=>{
    const v = Number(scoreFilter.value||0);
    applyFilter(v);
    const pctEl = document.getElementById('score-percent'); if (pctEl) pctEl.textContent = v + ' %';
  });
  scoreFilter.addEventListener('change', ()=>{
    const v = Number(scoreFilter.value||0);
    const shown = applyFilter(v);
    showToast(`${shown} fitur terlihat (>= ${v}%)`);
  });
}

// add scale control
L.control.scale({ position: 'bottomright' }).addTo(map);

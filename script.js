// Red Snipper — main app script
document.addEventListener('DOMContentLoaded', () => {
	// global error reporting helper (shows modal so user sees runtime errors)
	window.addEventListener('error', (ev) => {
		try{ openModal(`<h3>Runtime Error</h3><pre style="white-space:pre-wrap">${(ev && ev.message) || ev}</pre>`); }catch(e){ console.error('Error reporting failed', e); }
	});
	window.addEventListener('unhandledrejection', (ev) => {
		try{ openModal(`<h3>Unhandled Rejection</h3><pre style="white-space:pre-wrap">${(ev && ev.reason) || ev}</pre>`); }catch(e){ console.error('Promise rejection reporting failed', e); }
	});
	// --- Config & helpers ---
	const initialView = { center: [-4.5, 118.5], zoom: 5 };
	const el = id => document.getElementById(id);
	const downloadFile = (filename, content, mime = 'text/csv') => {
		const blob = new Blob([content], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
	};

	// --- DOM ---
	const mapEl = el('map');
	const listEl = el('location-list');
	const searchInput = el('search-input');
	const infoContent = el('info-content');
	const btnZoomAll = el('btn-zoom-all');
	const btnReset = el('btn-reset-view');
	const btnExport = el('btn-export');
	const btnTheme = el('btn-theme-toggle');
	const btnBasemap = el('btn-basemap-toggle');
	const modal = el('modal');
	const modalBody = el('modal-body');
	const modalClose = el('modal-close');
	const btnLocate = el('btn-locate');
	let _userMarker = null;
	let _userCircle = null;

	// --- Map & basemaps ---
	const map = L.map(mapEl).setView(initialView.center, initialView.zoom);

	// Debug helper: log map clicks to help reproduce any unprocessed-click issues
	map.on('click', (e) => {
		try{ console.info('MAP_CLICK', e.latlng); }catch(e){}
	});
	const basemapLight = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri' });
	const basemapDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: '© OpenStreetMap, CARTO' });
	let currentBasemap = 'light';
	basemapLight.addTo(map);

	// ensure map invalidates size when tiles load or when ready to avoid misaligned tiles
	basemapLight.on && basemapLight.on('load', ()=> setTimeout(()=> invalidate(), 50));
	basemapDark.on && basemapDark.on('load', ()=> setTimeout(()=> invalidate(), 50));
	map.whenReady(()=> setTimeout(()=> invalidate(), 100));

	// marker cluster (default/simple)
	const clusterGroup = L.markerClusterGroup({ chunkedLoading: true });
	map.addLayer(clusterGroup);

	// small popup template
	const popupHTML = loc => `
		<div style="min-width:180px">
			<strong>${loc.name}</strong>
			<div style="font-size:0.9rem;color:#6b7280;margin-top:6px">${loc.analysis.title}</div>
			<div style="margin-top:8px;font-size:0.9rem"><strong>Status:</strong> ${loc.analysis.statusText}</div>
		</div>
	`;

	// Create a colored div icon for a location
	function createIcon(status){
		const cls = status === 'suitable' ? 'suitable' : status === 'less' ? 'less' : 'unsuitable';
		const html = `<span class="marker-dot ${cls}"></span>`;
		return L.divIcon({ html, className: 'rs-marker', iconSize: [18, 18], iconAnchor: [9, 9] });
	}

	// render locations from global `locations` (data.js)
	function renderLocations(locations){
		clusterGroup.clearLayers();
		listEl.innerHTML = '';

		locations.forEach(loc => {
			// marker
			const m = L.marker(loc.coords, { icon: createIcon(loc.status) }).bindPopup(popupHTML(loc));

			clusterGroup.addLayer(m);
			loc._marker = m; // ref

			// ensure marker click updates info panel & active state
			m.on('click', () => {
				showInfo(loc);
				updateActive(loc.id);
			});

			// list item
			const li = document.createElement('li');
			li.className = 'location-item';
			li.tabIndex = 0;
			li.dataset.id = loc.id;
			li.innerHTML = `
				<div>
					<div style="display:flex;align-items:center;gap:10px">
						<div style="font-weight:700">${loc.name}</div>
							<div style="margin-left:6px" class="badge ${loc.status}">${loc.analysis.statusText}</div>
					</div>
						<div class="meta">${loc.analysis.title}</div>
						${loc.thumbnail ? `<div style="margin-top:10px"><img src="${loc.thumbnail}" alt="${loc.name} thumbnail" style="width:100%;height:auto;border-radius:8px;cursor:pointer" class="thumb" data-id="${loc.id}"></div>` : ''}
				</div>
			`;
			listEl.appendChild(li);
		});
	}

	// --- Interaction helpers ---
	function showInfo(loc){
		infoContent.innerHTML = `
			<h3 style="margin:0 0 6px">${loc.name}</h3>
			<div style="margin-bottom:8px"><span class="badge ${loc.status}">${loc.analysis.statusText}</span></div>
			<div style="font-size:0.95rem;color:#334155"><strong>${loc.analysis.title}</strong></div>
			<ul style="margin-top:8px;color:#475569">
				<li><strong>Suhu Permukaan Laut:</strong> ${loc.analysis.suhuPermukaanLaut || '-'}</li>
				<li><strong>Klorofil a:</strong> ${loc.analysis.klorofilA || '-'}</li>
				<li><strong>Salinitas:</strong> ${loc.analysis.salinitas || '-'}</li>
				<li><strong>Arus Laut:</strong> ${loc.analysis.arusLaut || '-'}</li>
				<li><strong>Kedalaman:</strong> ${loc.analysis.kedalaman || '-'}</li>
			</ul>
			<p style="margin-top:8px;color:#334155"><strong>Catatan:</strong> ${loc.analysis.notes}</p>
		`;
	}

	function openModal(html){
		modalBody.innerHTML = html; modal.setAttribute('aria-hidden','false');
	}
	function closeModal(){ modal.setAttribute('aria-hidden','true'); }

	function updateActive(id){
		document.querySelectorAll('.location-item').forEach(it => {
			if (it.dataset.id === id) { it.classList.add('active'); try{it.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){} }
			else it.classList.remove('active');
		});
	}

	// Click handler (delegated)
	listEl.addEventListener('click', (e)=>{
		const li = e.target.closest('.location-item'); if (!li) return;
		const id = li.dataset.id; const loc = window.locations.find(x=>x.id===id); if (!loc) return;
		// fly and open popup when moveend to ensure popup positions correctly
		map.flyTo(loc.coords, 10, { duration: 1.2 });
		map.once('moveend', () => {
			if (loc._marker && loc._marker.openPopup) loc._marker.openPopup();
		});
		showInfo(loc); updateActive(id);
	});

	// popup/thumb click handler to open modal with larger image
	document.addEventListener('click', (e)=>{
		const t = e.target;
		if (t && t.classList && t.classList.contains('thumb')){
			const id = t.dataset.id; const loc = window.locations.find(x=>x.id===id); if (!loc) return;
			openModal(`<h3>${loc.name}</h3><img src="${loc.image || loc.thumbnail}" alt="${loc.name}" /><div class="caption">${loc.analysis.title}</div><p style="margin-top:8px">${loc.analysis.notes}</p>`);
		}
	});

	// keyboard
	listEl.addEventListener('keydown', (e)=>{
		if (e.key !== 'Enter' && e.key !== ' ') return; const li = e.target.closest('.location-item'); if (!li) return; e.preventDefault(); li.click();
	});

	// marker click: show detail in panel and select list item
	clusterGroup.on('click', (ev)=>{
		const marker = ev.layer; // marker clicked
		// find location
		const loc = window.locations.find(l => l._marker && l._marker === marker);
		if (loc) { showInfo(loc); updateActive(loc.id); }
	});

	// --- map controls ---
	if (btnZoomAll) btnZoomAll.addEventListener('click', ()=>{
		const bounds = clusterGroup.getBounds();
		if (!bounds || !bounds.isValid()) { map.flyTo(initialView.center, initialView.zoom); return; }
		if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.flyTo(bounds.getCenter(), 10); else map.fitBounds(bounds.pad(0.12));
	});
	if (btnReset) btnReset.addEventListener('click', ()=> map.flyTo(initialView.center, initialView.zoom));

	// invalidate size helper & debounce
	function debounce(fn, wait=150){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=> fn.apply(this,args), wait); } }

	const invalidate = ()=>{ try{ map.invalidateSize(); }catch(e){} };

	window.addEventListener('resize', debounce(()=>{ invalidate(); }, 200));

	// theme & basemap (simple)
	const THEME_KEY = 'rs-theme';
	function applyTheme(t){ if (t==='dark') document.body.classList.add('theme-dark'); else document.body.classList.remove('theme-dark'); try{localStorage.setItem(THEME_KEY,t)}catch(e){} }
	(function initTheme(){ let s=null; try{s=localStorage.getItem(THEME_KEY)}catch(e){}; if(s) applyTheme(s); else applyTheme(window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'); })();
	if (btnTheme) btnTheme.addEventListener('click', ()=>{ const is = document.body.classList.toggle('theme-dark'); applyTheme(is?'dark':'light'); setTimeout(()=> invalidate(), 300); });

	// basemap toggle
	if (btnBasemap) btnBasemap.addEventListener('click', ()=>{
		if (currentBasemap==='light'){
			map.removeLayer(basemapLight); basemapDark.addTo(map); currentBasemap='dark';
		} else {
			map.removeLayer(basemapDark); basemapLight.addTo(map); currentBasemap='light';
		}
		setTimeout(()=> invalidate(), 250);
	});

	// search filter
	if (searchInput) searchInput.addEventListener('input', (e)=>{
		const q = (e.target.value||'').trim().toLowerCase();
		document.querySelectorAll('.location-item').forEach(li=>{
			const name = li.textContent.toLowerCase(); li.style.display = (!q || name.includes(q)) ? '' : 'none';
		});
	});

	// export CSV for currently visible items
	if (btnExport) btnExport.addEventListener('click', ()=>{
		const rows = [['id','name','status','suhu_perm_laut','klorofil_a','salinitas','arus_laut','kedalaman','notes']];
		document.querySelectorAll('.location-item').forEach(li=>{
			if (li.style.display === 'none') return; const id = li.dataset.id; const loc = window.locations.find(x=>x.id===id); if(!loc) return;
			const a = loc.analysis || {};
			rows.push([
				loc.id,
				loc.name,
				loc.status,
				a.suhuPermukaanLaut || '',
				a.klorofilA || '',
				a.salinitas || '',
				a.arusLaut || '',
				a.kedalaman || '',
				`"${(a.notes||'').replace(/"/g,'""') }"`
			]);
		});
		const csv = rows.map(r => r.join(',')).join('\n'); downloadFile('red-snipper-locations.csv', csv);
	});

	// modal handlers
	if (modalClose) modalClose.addEventListener('click', closeModal);
	if (modal) modal.addEventListener('click', (e)=>{ if (e.target === modal) closeModal(); });

	// locate handler: center map on user's location
	if (btnLocate){
		btnLocate.addEventListener('click', ()=>{
			if (!navigator.geolocation){ openModal('<h3>Geolocation tidak didukung</h3><p>Browser Anda tidak mendukung akses lokasi.</p>'); return; }
			// show spinner while asking permission
			try{ document.getElementById('spinner').setAttribute('aria-hidden','false'); }catch(e){}
			navigator.geolocation.getCurrentPosition((pos)=>{
				try{ document.getElementById('spinner').setAttribute('aria-hidden','true'); }catch(e){}
				const lat = pos.coords.latitude; const lng = pos.coords.longitude;
				// remove previous marker
				if (_userMarker) { try{ map.removeLayer(_userMarker); }catch(e){} _userMarker = null; }
				// create a small custom marker
				const userIcon = L.divIcon({ className: 'user-location', html: '<span class="user-location-outer"><span class="user-location-inner"></span></span>', iconSize:[18,18], iconAnchor:[9,9] });
				_userMarker = L.marker([lat,lng], { icon: userIcon }).addTo(map).bindPopup('Lokasi Anda').openPopup();
				// optionally add accuracy circle
				if (pos.coords.accuracy){ try{ _userCircle && map.removeLayer(_userCircle); _userCircle = L.circle([lat,lng], { radius: Math.min(pos.coords.accuracy,5000), color:'rgba(32,201,151,0.35)', fillOpacity:0.06 }).addTo(map); }catch(e){} }
				map.flyTo([lat,lng], 13, { duration: 1.0 });
			}, (err)=>{
				try{ document.getElementById('spinner').setAttribute('aria-hidden','true'); }catch(e){}
				let msg = 'Gagal mendapatkan lokasi.';
				switch(err.code){ case err.PERMISSION_DENIED: msg = 'Akses lokasi ditolak oleh pengguna.'; break; case err.POSITION_UNAVAILABLE: msg = 'Lokasi tidak tersedia.'; break; case err.TIMEOUT: msg = 'Permintaan lokasi timeout.'; break; }
				openModal(`<h3>Akses Lokasi</h3><p>${msg}</p><pre style="white-space:pre-wrap">${err && err.message ? err.message : ''}</pre>`);
			}, { enableHighAccuracy:true, timeout:10000, maximumAge:0 });
		});
	}

	// initial render from data.js (global `locations` expected)
	function attemptRender(retries = 5, delay = 200){
		if (window.locations && window.locations.length){
			try {
				renderLocations(window.locations);
			} catch(err) {
				console.error('renderLocations failed', err);
				try{ openModal(`<h3>Error saat merender lokasi</h3><pre style="white-space:pre-wrap">${err && err.stack ? err.stack : err}</pre>`); }catch(e){}
			}
			// fit to bounds nicely after render
			const b = clusterGroup.getBounds();
			if (b && b.isValid()){
				try{ map.fitBounds(b.pad(0.12)); }catch(e){ map.setView(initialView.center, initialView.zoom); }
			} else {
				map.setView(initialView.center, initialView.zoom);
			}
			// ensure map renders correctly after layout
			setTimeout(()=> invalidate(), 250);
			// extra invalidate after a bit to address tile offsets
			setTimeout(()=> invalidate(), 800);
			return true;
		} else if (retries > 0) {
			setTimeout(()=> attemptRender(retries-1, delay), delay);
			return false;
		} else {
			infoContent.textContent = 'Tidak ada data lokasi (data.js kosong).';
			return false;
		}
	}

	attemptRender();

	// Intro overlay handling (two-section landing)
	const intro = el('intro');
	const introStart = el('intro-start');
	const introDismiss = el('intro-dismiss');
	const tabButtons = document.querySelectorAll('.tab-btn');
	const tabPanes = document.querySelectorAll('.tab-pane');

	const INTRO_KEY = 'rs-seen-intro';

	function hideIntro(persist = true){
		if (!intro) return;
		intro.setAttribute('aria-hidden','true');
		intro.style.display = 'none';
		if (persist) try{ localStorage.setItem(INTRO_KEY, '1'); }catch(e){}
		setTimeout(()=> invalidate(), 220);
	}

	// Tab switching
	tabButtons.forEach(btn => {
		btn.addEventListener('click', ()=>{
			const tab = btn.dataset.tab;
			tabButtons.forEach(b => b.classList.toggle('active', b === btn));
			tabPanes.forEach(p => p.style.display = (p.dataset.tab === tab) ? '' : 'none');
		});
	});

	// If user already saw intro, hide it
	let seenIntro = false;
	try{ seenIntro = !!localStorage.getItem(INTRO_KEY); }catch(e){}
	if (seenIntro){
		if (intro) { intro.setAttribute('aria-hidden','true'); intro.style.display='none'; }
	} else {
		// show intro for first-time users (ensure it's visible after JS loads)
		if (intro) { intro.setAttribute('aria-hidden','false'); intro.style.display = 'flex'; }
	}

	if (introStart) introStart.addEventListener('click', ()=>{ hideIntro(true); });
	if (introDismiss) introDismiss.addEventListener('click', ()=>{ hideIntro(false); });

});


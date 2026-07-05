/* hurricane-atlas.js - historical storm-track atlas */

(function () {
  'use strict';

  var root = document.querySelector('[data-hurricane-atlas]');
  var data = window.HURRICANE_ATLAS_DATA;

  if (!root || !data || !Array.isArray(data.storms) || !data.storms.length) {
    return;
  }

  var MAPLIBRE_VERSION = '5.24.0';
  var MAPLIBRE_JS = 'https://unpkg.com/maplibre-gl@' + MAPLIBRE_VERSION + '/dist/maplibre-gl.js';
  var MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@' + MAPLIBRE_VERSION + '/dist/maplibre-gl.css';
  var OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
  var ATLANTIC_BOUNDS = [[-103.5, 5.2], [-48.2, 47.8]];
  var DEFAULT_STORM_ID = 'AL122005';
  var STATUS_LABELS = {
    TD: 'Tropical depression',
    TS: 'Tropical storm',
    HU: 'Hurricane',
    EX: 'Extratropical',
    SD: 'Subtropical depression',
    SS: 'Subtropical storm',
    LO: 'Low',
    WV: 'Wave',
    DB: 'Disturbance'
  };
  var CATEGORY_COLORS = {
    0: '#3A6B83',
    1: '#477F8B',
    2: '#6C9B8D',
    3: '#D9A441',
    4: '#C2742B',
    5: '#B8404C'
  };

  var mapNode = root.querySelector('#hurricane-atlas-map');
  var mapPanel = root.querySelector('[data-atlas-map-panel]');
  var placeholder = root.querySelector('[data-atlas-placeholder]');
  var statusNode = root.querySelector('[data-atlas-status]');
  var loadingNote = root.querySelector('[data-atlas-loading-note]');
  var countNode = root.querySelector('[data-atlas-count]');
  var sourceNode = root.querySelector('[data-atlas-source]');
  var decadeControl = root.querySelector('[data-atlas-decade]');
  var regionControl = root.querySelector('[data-atlas-region]');
  var stormControl = root.querySelector('[data-atlas-storm]');
  var layerControls = Array.prototype.slice.call(root.querySelectorAll('[data-atlas-layer]'));
  var selectedTitles = Array.prototype.slice.call(root.querySelectorAll('[data-atlas-selected-title]'));
  var selectedSummary = root.querySelector('[data-atlas-selected-summary]');
  var selectedStats = root.querySelector('[data-atlas-selected-stats]');
  var selectedMetas = Array.prototype.slice.call(root.querySelectorAll('[data-atlas-selected-meta]'));
  var stormList = root.querySelector('[data-atlas-storm-list]');

  var map = null;
  var selectedStormId = data.storms.some(function (storm) { return storm.id === DEFAULT_STORM_ID; })
    ? DEFAULT_STORM_ID
    : data.storms[0].id;
  var activePopup = null;

  function setStatus(message, state) {
    if (!statusNode) return;
    statusNode.textContent = message;
    if (state) {
      statusNode.dataset.state = state;
    } else {
      delete statusNode.dataset.state;
    }
  }

  function setLoading(isLoading) {
    if (loadingNote) {
      loadingNote.hidden = !isLoading;
    }
  }

  function loadStylesheet(href) {
    if (document.querySelector('link[href="' + href + '"]')) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = function () {
        reject(new Error('Could not load ' + href));
      };
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    if (window.maplibregl) {
      return Promise.resolve();
    }

    var existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      return new Promise(function (resolve, reject) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
      });
    }

    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error('Could not load ' + src));
      };
      document.body.appendChild(script);
    });
  }

  function fetchJson(url) {
    return window.fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    });
  }

  function themeStyle(style) {
    if (!style || !Array.isArray(style.layers)) {
      return style;
    }

    style.layers.forEach(function (layer) {
      var id = String(layer.id || '').toLowerCase();
      layer.paint = layer.paint || {};

      if (layer.type === 'background') {
        layer.paint['background-color'] = '#E7DFD0';
      }

      if (layer.type === 'fill') {
        if (/water|ocean|lake|river|reservoir/.test(id)) {
          layer.paint['fill-color'] = '#86A7B1';
          layer.paint['fill-opacity'] = 0.95;
        } else if (/land|earth/.test(id)) {
          layer.paint['fill-color'] = '#E6D9C2';
        } else if (/park|wood|forest|landcover|grass|scrub|national/.test(id)) {
          layer.paint['fill-color'] = '#B7BE9B';
          layer.paint['fill-opacity'] = 0.66;
        } else if (/building/.test(id)) {
          layer.paint['fill-color'] = '#D3C6AF';
          layer.paint['fill-opacity'] = 0.5;
        }
      }

      if (layer.type === 'line') {
        if (/water|river|stream|canal/.test(id)) {
          layer.paint['line-color'] = '#558AA0';
          layer.paint['line-opacity'] = 0.8;
        } else if (/road|bridge|tunnel|path|rail/.test(id)) {
          layer.paint['line-color'] = '#B5A68D';
          layer.paint['line-opacity'] = 0.54;
        } else if (/boundary|admin/.test(id)) {
          layer.paint['line-color'] = '#847762';
          layer.paint['line-opacity'] = 0.46;
        }
      }

      if (layer.type === 'symbol') {
        if (layer.paint['text-color'] !== undefined) {
          layer.paint['text-color'] = '#2F3438';
        }
        if (layer.paint['text-halo-color'] !== undefined) {
          layer.paint['text-halo-color'] = '#F2EBDD';
          layer.paint['text-halo-width'] = 1.2;
        }
        if (/poi|airport|transit/.test(id)) {
          layer.layout = layer.layout || {};
          layer.layout.visibility = 'none';
        }
      }
    });

    return style;
  }

  function getMapStyle() {
    return fetchJson(OPENFREEMAP_STYLE).then(themeStyle).catch(function () {
      return OPENFREEMAP_STYLE;
    });
  }

  function getLayerState(name) {
    var input = root.querySelector('[data-atlas-layer="' + name + '"]');
    return !input || input.checked;
  }

  function filteredStorms() {
    var decade = decadeControl ? decadeControl.value : 'all';
    var region = regionControl ? regionControl.value : 'all';

    return data.storms.filter(function (storm) {
      var matchesDecade = decade === 'all' || String(storm.decade) === decade;
      var matchesRegion = region === 'all' || storm.regions.indexOf(region) !== -1;
      return matchesDecade && matchesRegion;
    });
  }

  function findStorm(id) {
    return data.storms.find(function (storm) {
      return storm.id === id;
    }) || data.storms[0];
  }

  function activeStorms() {
    var storms = filteredStorms();
    var selected = findStorm(selectedStormId);

    if (!storms.some(function (storm) { return storm.id === selected.id; })) {
      storms = storms.concat(selected);
    }

    return storms;
  }

  function pointDescription(point) {
    var status = STATUS_LABELS[point.status] || point.status || 'Storm point';
    var category = point.category > 0 ? ', Cat ' + point.category : '';
    var pressure = point.pressure ? ', ' + point.pressure + ' mb' : '';
    return status + category + ', ' + point.wind + ' kt' + pressure;
  }

  function trackFeatures() {
    var showHistorical = getLayerState('tracks');
    var selected = findStorm(selectedStormId);

    return activeStorms()
      .filter(function (storm) {
        return showHistorical || storm.id === selected.id;
      })
      .map(function (storm) {
        return {
          type: 'Feature',
          properties: {
            id: storm.id,
            name: storm.displayName,
            year: storm.year,
            category: storm.category,
            color: CATEGORY_COLORS[storm.category] || CATEGORY_COLORS[0],
            selected: storm.id === selected.id,
            summary: storm.summary
          },
          geometry: {
            type: 'LineString',
            coordinates: storm.points.map(function (point) {
              return [point.lon, point.lat];
            })
          }
        };
      });
  }

  function selectedTrackFeature() {
    var storm = findStorm(selectedStormId);
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          id: storm.id,
          name: storm.displayName,
          year: storm.year,
          category: storm.category
        },
        geometry: {
          type: 'LineString',
          coordinates: storm.points.map(function (point) {
            return [point.lon, point.lat];
          })
        }
      }]
    };
  }

  function pointFeatures(kind) {
    var storms = activeStorms();
    var features = [];

    storms.forEach(function (storm) {
      storm.points.forEach(function (point) {
        if (kind === 'major' && point.category < 3) return;
        if (kind === 'landfall' && !point.landfall) return;

        features.push({
          type: 'Feature',
          properties: {
            id: storm.id,
            name: storm.displayName,
            year: storm.year,
            date: point.date,
            time: point.time,
            wind: point.wind,
            pressure: point.pressure || '',
            category: point.category,
            color: CATEGORY_COLORS[point.category] || CATEGORY_COLORS[0],
            description: pointDescription(point),
            selected: storm.id === selectedStormId
          },
          geometry: {
            type: 'Point',
            coordinates: [point.lon, point.lat]
          }
        });
      });
    });

    return {
      type: 'FeatureCollection',
      features: features
    };
  }

  function tracksFeatureCollection() {
    return {
      type: 'FeatureCollection',
      features: trackFeatures()
    };
  }

  function setSourceData(id, collection) {
    if (!map || !map.getSource(id)) return;
    map.getSource(id).setData(collection);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function popupHtml(properties) {
    var category = Number(properties.category) > 0 ? 'Cat ' + properties.category : 'Tropical';
    var detail = properties.description || properties.summary || '';
    return '<div class="hurricane-atlas-popup">'
      + '<h4>' + escapeHtml(properties.name) + ' ' + escapeHtml(properties.year) + '</h4>'
      + '<p><strong>' + escapeHtml(category) + '</strong>' + (detail ? ' · ' + escapeHtml(detail) : '') + '</p>'
      + '</div>';
  }

  function showPopup(event) {
    if (!map || !event.features || !event.features.length) return;
    var feature = event.features[0];

    if (feature.properties && feature.properties.id) {
      selectedStormId = feature.properties.id;
      syncControls();
      updateAtlas(true);
    }

    if (activePopup) {
      activePopup.remove();
    }

    activePopup = new window.maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '280px'
    })
      .setLngLat(event.lngLat)
      .setHTML(popupHtml(feature.properties || {}))
      .addTo(map);
  }

  function fitSelectedStorm() {
    if (!map) return;
    var storm = findStorm(selectedStormId);
    var box = storm.bbox;
    var west = Math.max(ATLANTIC_BOUNDS[0][0], box.west - 3.4);
    var south = Math.max(ATLANTIC_BOUNDS[0][1], box.south - 2.4);
    var east = Math.min(ATLANTIC_BOUNDS[1][0], box.east + 3.4);
    var north = Math.min(ATLANTIC_BOUNDS[1][1], box.north + 2.4);

    map.fitBounds([[west, south], [east, north]], {
      padding: { top: 56, right: 56, bottom: 98, left: 56 },
      maxZoom: 5.4,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650
    });
  }

  function updateSelectedCopy() {
    var storm = findStorm(selectedStormId);
    var pressure = storm.minPressure ? storm.minPressure + ' mb minimum pressure' : 'Pressure not available';

    selectedTitles.forEach(function (node) {
      node.textContent = storm.displayName + ' ' + storm.year;
    });
    if (selectedSummary) {
      selectedSummary.textContent = storm.summary;
    }
    selectedMetas.forEach(function (node) {
      node.textContent = storm.whyIncluded + ' · ' + storm.dateRange;
    });
    if (selectedStats) {
      selectedStats.innerHTML = ''
        + '<span><strong>' + storm.categoryLabel + '</strong> peak</span>'
        + '<span><strong>' + storm.maxWind + ' kt</strong> max wind</span>'
        + '<span><strong>' + pressure + '</strong></span>'
        + '<span><strong>' + storm.landfallCount + '</strong> HURDAT landfall marker' + (storm.landfallCount === 1 ? '' : 's') + '</span>';
    }
  }

  function renderStormList() {
    if (!stormList) return;
    var storms = filteredStorms();
    var fragment = document.createDocumentFragment();

    if (!storms.some(function (storm) { return storm.id === selectedStormId; }) && storms.length) {
      selectedStormId = storms[0].id;
    }

    storms.forEach(function (storm) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'hurricane-atlas-storm-button';
      button.dataset.stormId = storm.id;
      button.setAttribute('aria-pressed', storm.id === selectedStormId ? 'true' : 'false');
      button.innerHTML = '<span>' + escapeHtml(storm.displayName) + '</span><small>' + storm.year + ' · Cat ' + storm.category + '</small>';
      button.addEventListener('click', function () {
        selectedStormId = storm.id;
        syncControls();
        updateAtlas(true);
      });
      fragment.appendChild(button);
    });

    stormList.innerHTML = '';
    stormList.appendChild(fragment);
  }

  function syncControls() {
    if (stormControl && stormControl.value !== selectedStormId) {
      stormControl.value = selectedStormId;
    }

    if (stormList) {
      Array.prototype.slice.call(stormList.querySelectorAll('[data-storm-id]')).forEach(function (button) {
        button.setAttribute('aria-pressed', button.dataset.stormId === selectedStormId ? 'true' : 'false');
      });
    }
  }

  function updateCount() {
    if (!countNode) return;
    var count = filteredStorms().length;
    countNode.textContent = count + ' storm' + (count === 1 ? '' : 's') + ' shown';
  }

  function updateAtlas(shouldFit) {
    renderStormList();
    syncControls();
    updateSelectedCopy();
    updateCount();

    setSourceData('atlas-tracks', tracksFeatureCollection());
    setSourceData('atlas-selected-track', selectedTrackFeature());
    setSourceData('atlas-major-points', getLayerState('major') ? pointFeatures('major') : { type: 'FeatureCollection', features: [] });
    setSourceData('atlas-landfall-points', getLayerState('landfall') ? pointFeatures('landfall') : { type: 'FeatureCollection', features: [] });

    if (map && map.getLayer('atlas-tracks')) {
      map.setLayoutProperty('atlas-tracks', 'visibility', getLayerState('tracks') ? 'visible' : 'none');
      map.setLayoutProperty('atlas-tracks-casing', 'visibility', getLayerState('tracks') ? 'visible' : 'none');
      map.setLayoutProperty('atlas-major-points', 'visibility', getLayerState('major') ? 'visible' : 'none');
      map.setLayoutProperty('atlas-landfall-points', 'visibility', getLayerState('landfall') ? 'visible' : 'none');
    }

    if (shouldFit) {
      fitSelectedStorm();
    }
  }

  function populateControls() {
    if (decadeControl) {
      var decades = Array.from(new Set(data.storms.map(function (storm) { return storm.decade; }))).sort();
      decades.forEach(function (decade) {
        var option = document.createElement('option');
        option.value = String(decade);
        option.textContent = decade + 's';
        decadeControl.appendChild(option);
      });
    }

    if (stormControl) {
      stormControl.innerHTML = '';
      data.storms.forEach(function (storm) {
        var option = document.createElement('option');
        option.value = storm.id;
        option.textContent = storm.displayName + ' ' + storm.year;
        stormControl.appendChild(option);
      });
      stormControl.value = selectedStormId;
    }

    if (sourceNode) {
      sourceNode.innerHTML = 'Source: <a href="' + escapeHtml(data.source.url) + '" target="_blank" rel="noopener">NOAA/NHC HURDAT2 Atlantic best-track</a>. Curated local extract downloaded ' + escapeHtml(data.source.downloaded) + '.';
    }
  }

  function initEvents() {
    [decadeControl, regionControl].forEach(function (control) {
      if (!control) return;
      control.addEventListener('change', function () {
        updateAtlas(true);
      });
    });

    if (stormControl) {
      stormControl.addEventListener('change', function () {
        selectedStormId = stormControl.value;
        updateAtlas(true);
      });
    }

    layerControls.forEach(function (control) {
      control.addEventListener('change', function () {
        updateAtlas(false);
      });
    });
  }

  function addAtlasLayers() {
    map.addSource('atlas-tracks', {
      type: 'geojson',
      data: tracksFeatureCollection()
    });
    map.addSource('atlas-selected-track', {
      type: 'geojson',
      data: selectedTrackFeature()
    });
    map.addSource('atlas-major-points', {
      type: 'geojson',
      data: pointFeatures('major')
    });
    map.addSource('atlas-landfall-points', {
      type: 'geojson',
      data: pointFeatures('landfall')
    });

    map.addLayer({
      id: 'atlas-tracks-casing',
      type: 'line',
      source: 'atlas-tracks',
      paint: {
        'line-color': '#FBF8F2',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 2.2, 5, 5.8],
        'line-opacity': 0.68
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });

    map.addLayer({
      id: 'atlas-tracks',
      type: 'line',
      source: 'atlas-tracks',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.3, 5, 3.5],
        'line-opacity': ['case', ['boolean', ['get', 'selected'], false], 0.46, 0.34]
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });

    map.addLayer({
      id: 'atlas-selected-track-casing',
      type: 'line',
      source: 'atlas-selected-track',
      paint: {
        'line-color': '#FBF8F2',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 5, 5, 9.5],
        'line-opacity': 0.96
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });

    map.addLayer({
      id: 'atlas-selected-track',
      type: 'line',
      source: 'atlas-selected-track',
      paint: {
        'line-color': '#C2742B',
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 2.7, 5, 6.2],
        'line-opacity': 0.98
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });

    map.addLayer({
      id: 'atlas-major-points',
      type: 'circle',
      source: 'atlas-major-points',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'wind'], 96, 3, 165, 8],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.82,
        'circle-stroke-color': '#FBF8F2',
        'circle-stroke-width': 1.2
      }
    });

    map.addLayer({
      id: 'atlas-landfall-points',
      type: 'circle',
      source: 'atlas-landfall-points',
      paint: {
        'circle-radius': ['case', ['boolean', ['get', 'selected'], false], 6, 4.5],
        'circle-color': '#FBF8F2',
        'circle-opacity': 0.96,
        'circle-stroke-color': '#B8404C',
        'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 2.4, 1.6]
      }
    });

    ['atlas-tracks', 'atlas-selected-track', 'atlas-major-points', 'atlas-landfall-points'].forEach(function (layerId) {
      map.on('mouseenter', layerId, function () {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, function () {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', layerId, showPopup);
    });
  }

  function handleMapReady() {
    if (mapPanel) {
      mapPanel.classList.add('is-loaded');
    }
    if (placeholder) {
      placeholder.hidden = true;
    }

    addAtlasLayers();
    updateAtlas(false);
    fitSelectedStorm();
    setLoading(false);
    setStatus('Historical track map loaded.', 'ready');
  }

  function handleMapFailure(error) {
    setLoading(false);
    setStatus('Map tiles did not load. Storm controls and selected-track data are still available.', 'error');
    if (placeholder) {
      placeholder.hidden = false;
      placeholder.querySelector('p').textContent = 'The interactive basemap could not load. Use the storm controls for the historical track summaries.';
    }
    if (window.console && window.console.warn) {
      window.console.warn('Hurricane atlas map failed:', error);
    }
  }

  function initMap() {
    if (!mapNode || !window.fetch) {
      handleMapFailure(new Error('Map dependencies unavailable'));
      return;
    }

    setLoading(true);
    setStatus('Loading interactive map and selected HURDAT tracks.', 'loading');

    Promise.all([
      loadStylesheet(MAPLIBRE_CSS),
      loadScript(MAPLIBRE_JS),
      getMapStyle()
    ]).then(function (results) {
      var style = results[2];

      map = new window.maplibregl.Map({
        container: mapNode,
        style: style,
        center: [-78.7, 25.8],
        zoom: 3.15,
        minZoom: 2.2,
        maxZoom: 8,
        maxBounds: ATLANTIC_BOUNDS,
        attributionControl: false
      });

      map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new window.maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      map.once('load', handleMapReady);
      map.once('error', handleMapFailure);
    }).catch(handleMapFailure);
  }

  populateControls();
  initEvents();
  updateAtlas(false);
  initMap();
})();

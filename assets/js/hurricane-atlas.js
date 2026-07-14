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
  var documentLanguage = (document.documentElement.lang || 'en').toLowerCase();
  var isSpanish = documentLanguage === 'es' || documentLanguage.indexOf('es-') === 0;
  var COPY = isSpanish ? {
    statusLabels: {
      TD: 'Depresión tropical',
      TS: 'Tormenta tropical',
      HU: 'Huracán',
      EX: 'Extratropical',
      SD: 'Depresión subtropical',
      SS: 'Tormenta subtropical',
      LO: 'Baja presión',
      WV: 'Onda tropical',
      DB: 'Perturbación'
    },
    stormPoint: 'Punto de la tormenta',
    tropical: 'Tropical',
    category: 'Cat.',
    categoryLong: 'Categoría',
    minimumPressure: 'presión mínima',
    pressureUnavailable: 'Presión no disponible',
    peak: 'máxima',
    maxWind: 'viento máximo',
    landfallMarker: 'marcador de toque de tierra HURDAT',
    landfallMarkers: 'marcadores de toque de tierra HURDAT',
    stormShown: 'tormenta mostrada',
    stormsShown: 'tormentas mostradas',
    source: 'Fuente:',
    sourceLink: 'trayectoria óptima atlántica HURDAT2 de NOAA/NHC',
    sourceExtract: 'Extracto local seleccionado, descargado el',
    mapReady: 'Mapa de trayectorias históricas cargado.',
    mapFailure: 'No se cargaron los mosaicos del mapa. Los controles y los datos de la trayectoria seleccionada siguen disponibles.',
    placeholderFailure: 'No se pudo cargar el mapa base interactivo. Use los controles de tormentas para consultar los resúmenes de trayectorias históricas.',
    mapLoading: 'Cargando el mapa interactivo y las trayectorias HURDAT seleccionadas.'
  } : {
    statusLabels: {
      TD: 'Tropical depression',
      TS: 'Tropical storm',
      HU: 'Hurricane',
      EX: 'Extratropical',
      SD: 'Subtropical depression',
      SS: 'Subtropical storm',
      LO: 'Low',
      WV: 'Wave',
      DB: 'Disturbance'
    },
    stormPoint: 'Storm point',
    tropical: 'Tropical',
    category: 'Cat',
    categoryLong: 'Category',
    minimumPressure: 'minimum pressure',
    pressureUnavailable: 'Pressure not available',
    peak: 'peak',
    maxWind: 'max wind',
    landfallMarker: 'HURDAT landfall marker',
    landfallMarkers: 'HURDAT landfall markers',
    stormShown: 'storm shown',
    stormsShown: 'storms shown',
    source: 'Source:',
    sourceLink: 'NOAA/NHC HURDAT2 Atlantic best-track',
    sourceExtract: 'Curated local extract downloaded',
    mapReady: 'Historical track map loaded.',
    mapFailure: 'Map tiles did not load. Storm controls and selected-track data are still available.',
    placeholderFailure: 'The interactive basemap could not load. Use the storm controls for the historical track summaries.',
    mapLoading: 'Loading interactive map and selected HURDAT tracks.'
  };

  var ATLAS_COLOR_FALLBACKS = {
    mapBackground: '#FFF0D8',
    mapWater: '#A6DEDA',
    mapLand: '#FFF9EE',
    mapPark: '#DCE9B5',
    mapBuilding: '#F1D4BC',
    mapWaterLine: '#11B7B3',
    mapRoad: '#C7A98A',
    mapBoundary: '#64778A',
    mapText: '#102A43',
    mapTextHalo: '#FFF9EE',
    trackCasing: '#FFF9EE',
    selectedTrack: '#1649B8',
    landfallFill: '#FFF9EE',
    landfallStroke: '#EF5D72',
    category0: '#11B7B3',
    category1: '#4B9BE8',
    category2: '#86B83E',
    category3: '#E5A400',
    category4: '#E57843',
    category5: '#D63D65'
  };

  var ATLAS_COLOR_PROPERTIES = {
    mapBackground: '--atlas-map-background',
    mapWater: '--atlas-map-water',
    mapLand: '--atlas-map-land',
    mapPark: '--atlas-map-park',
    mapBuilding: '--atlas-map-building',
    mapWaterLine: '--atlas-map-water-line',
    mapRoad: '--atlas-map-road',
    mapBoundary: '--atlas-map-boundary',
    mapText: '--atlas-map-text',
    mapTextHalo: '--atlas-map-text-halo',
    trackCasing: '--atlas-track-casing',
    selectedTrack: '--atlas-selected-track',
    landfallFill: '--atlas-landfall-fill',
    landfallStroke: '--atlas-landfall-stroke',
    category0: '--atlas-category-0',
    category1: '--atlas-category-1',
    category2: '--atlas-category-2',
    category3: '--atlas-category-3',
    category4: '--atlas-category-4',
    category5: '--atlas-category-5'
  };

  function readAtlasColor(propertyName, fallback) {
    var value = '';

    if (window.getComputedStyle) {
      value = window.getComputedStyle(root).getPropertyValue(propertyName).trim();
    }

    if (!value) {
      return fallback;
    }

    if (window.CSS && typeof window.CSS.supports === 'function' && !window.CSS.supports('color', value)) {
      return fallback;
    }

    return value;
  }

  function readAtlasColors() {
    return Object.keys(ATLAS_COLOR_PROPERTIES).reduce(function (colors, key) {
      colors[key] = readAtlasColor(ATLAS_COLOR_PROPERTIES[key], ATLAS_COLOR_FALLBACKS[key]);
      return colors;
    }, {});
  }

  var ATLAS_COLORS = readAtlasColors();
  var CATEGORY_COLORS = {
    0: ATLAS_COLORS.category0,
    1: ATLAS_COLORS.category1,
    2: ATLAS_COLORS.category2,
    3: ATLAS_COLORS.category3,
    4: ATLAS_COLORS.category4,
    5: ATLAS_COLORS.category5
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
        layer.paint['background-color'] = ATLAS_COLORS.mapBackground;
      }

      if (layer.type === 'fill') {
        if (/water|ocean|lake|river|reservoir/.test(id)) {
          layer.paint['fill-color'] = ATLAS_COLORS.mapWater;
          layer.paint['fill-opacity'] = 0.95;
        } else if (/land|earth/.test(id)) {
          layer.paint['fill-color'] = ATLAS_COLORS.mapLand;
        } else if (/park|wood|forest|landcover|grass|scrub|national/.test(id)) {
          layer.paint['fill-color'] = ATLAS_COLORS.mapPark;
          layer.paint['fill-opacity'] = 0.66;
        } else if (/building/.test(id)) {
          layer.paint['fill-color'] = ATLAS_COLORS.mapBuilding;
          layer.paint['fill-opacity'] = 0.5;
        }
      }

      if (layer.type === 'line') {
        if (/water|river|stream|canal/.test(id)) {
          layer.paint['line-color'] = ATLAS_COLORS.mapWaterLine;
          layer.paint['line-opacity'] = 0.8;
        } else if (/road|bridge|tunnel|path|rail/.test(id)) {
          layer.paint['line-color'] = ATLAS_COLORS.mapRoad;
          layer.paint['line-opacity'] = 0.54;
        } else if (/boundary|admin/.test(id)) {
          layer.paint['line-color'] = ATLAS_COLORS.mapBoundary;
          layer.paint['line-opacity'] = 0.46;
        }
      }

      if (layer.type === 'symbol') {
        if (layer.paint['text-color'] !== undefined) {
          layer.paint['text-color'] = ATLAS_COLORS.mapText;
        }
        if (layer.paint['text-halo-color'] !== undefined) {
          layer.paint['text-halo-color'] = ATLAS_COLORS.mapTextHalo;
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
    var status = COPY.statusLabels[point.status] || point.status || COPY.stormPoint;
    var category = point.category > 0 ? ', ' + COPY.category + ' ' + point.category : '';
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
    var category = Number(properties.category) > 0 ? COPY.category + ' ' + properties.category : COPY.tropical;
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
    var categoryLabel = isSpanish ? COPY.categoryLong + ' ' + storm.category : storm.categoryLabel;
    var pressure = storm.minPressure ? storm.minPressure + ' mb ' + COPY.minimumPressure : COPY.pressureUnavailable;

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
        + '<span><strong>' + escapeHtml(categoryLabel) + '</strong> ' + COPY.peak + '</span>'
        + '<span><strong>' + escapeHtml(storm.maxWind) + ' kt</strong> ' + COPY.maxWind + '</span>'
        + '<span><strong>' + escapeHtml(pressure) + '</strong></span>'
        + '<span><strong>' + escapeHtml(storm.landfallCount) + '</strong> ' + (storm.landfallCount === 1 ? COPY.landfallMarker : COPY.landfallMarkers) + '</span>';
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
      button.innerHTML = '<span>' + escapeHtml(storm.displayName) + '</span><small>' + storm.year + ' · ' + COPY.category + ' ' + storm.category + '</small>';
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
    countNode.textContent = count + ' ' + (count === 1 ? COPY.stormShown : COPY.stormsShown);
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
      sourceNode.innerHTML = COPY.source + ' <a href="' + escapeHtml(data.source.url) + '" target="_blank" rel="noopener">' + COPY.sourceLink + '</a>. ' + COPY.sourceExtract + ' ' + escapeHtml(data.source.downloaded) + '.';
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
        'line-color': ATLAS_COLORS.trackCasing,
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
        'line-color': ATLAS_COLORS.trackCasing,
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
        'line-color': ATLAS_COLORS.selectedTrack,
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
        'circle-stroke-color': ATLAS_COLORS.trackCasing,
        'circle-stroke-width': 1.2
      }
    });

    map.addLayer({
      id: 'atlas-landfall-points',
      type: 'circle',
      source: 'atlas-landfall-points',
      paint: {
        'circle-radius': ['case', ['boolean', ['get', 'selected'], false], 6, 4.5],
        'circle-color': ATLAS_COLORS.landfallFill,
        'circle-opacity': 0.96,
        'circle-stroke-color': ATLAS_COLORS.landfallStroke,
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
    setStatus(COPY.mapReady, 'ready');
  }

  function handleMapFailure(error) {
    setLoading(false);
    setStatus(COPY.mapFailure, 'error');
    if (placeholder) {
      placeholder.hidden = false;
      var placeholderCopy = placeholder.querySelector('p');
      if (placeholderCopy) {
        placeholderCopy.textContent = COPY.placeholderFailure;
      }
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
    setStatus(COPY.mapLoading, 'loading');

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

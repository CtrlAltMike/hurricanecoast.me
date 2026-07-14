/* live-alert-ticker.js — homepage-only NWS tropical alerts strip */

(function () {
  'use strict';

  if (window.HSLLiveAlertTickerScriptLoaded) {
    window.HSLLiveAlertTickerScriptLoaded();
  }

  var ticker = document.querySelector('[data-live-alert-ticker]');
  var track = document.querySelector('[data-live-alert-items]');
  var readout = document.querySelector('[data-live-alert-updated]');

  if (!ticker || !track || !readout) {
    return;
  }

  var language = (document.documentElement.lang || 'en').toLowerCase();
  var isSpanish = language === 'es' || language.indexOf('es-') === 0;
  var strings = isSpanish ? {
    alert: 'Alerta',
    affectedArea: 'Zona afectada',
    empty: 'No hay alertas tropicales activas del NWS en este momento.',
    loading: 'Cargando alertas tropicales activas del NWS…',
    connecting: 'NWS · Conectando…',
    updated: 'NWS · Actualizado ',
    failure: 'No se pudieron cargar las alertas tropicales en vivo del NWS en este momento.',
    unavailable: 'NWS · No disponible'
  } : {
    alert: 'Alert',
    affectedArea: 'Affected area',
    empty: 'No active NWS tropical alerts right now.',
    loading: 'Loading live NWS tropical alerts…',
    connecting: 'NWS · Connecting…',
    updated: 'NWS · Updated ',
    failure: 'Unable to load live NWS tropical alerts right now.',
    unavailable: 'NWS · Unavailable'
  };

  var tropicalEvents = [
    'Hurricane Warning',
    'Storm Surge Warning',
    'Tropical Storm Warning',
    'Hurricane Watch',
    'Storm Surge Watch',
    'Tropical Storm Watch'
  ];

  var eventPriority = tropicalEvents.reduce(function (map, eventName, index) {
    map[eventName] = index;
    return map;
  }, Object.create(null));

  var eventLabels = isSpanish ? {
    'Hurricane Warning': 'Aviso de huracán',
    'Storm Surge Warning': 'Aviso de marejada ciclónica',
    'Tropical Storm Warning': 'Aviso de tormenta tropical',
    'Hurricane Watch': 'Vigilancia de huracán',
    'Storm Surge Watch': 'Vigilancia de marejada ciclónica',
    'Tropical Storm Watch': 'Vigilancia de tormenta tropical'
  } : Object.create(null);

  var endpoint = 'https://api.weather.gov/alerts/active?'
    + tropicalEvents.map(function (eventName) {
      return 'event=' + encodeURIComponent(eventName);
    }).join('&');

  var refreshMs = 30 * 60 * 1000;
  var visibilityThrottleMs = 60 * 1000;
  var maxAlerts = 20;
  var lastRefreshStartedAt = 0;
  var inFlight = false;

  if (!window.XMLHttpRequest) {
    setTickerState('error');
    appendMessage(strings.failure);
    readout.textContent = strings.unavailable;
    return;
  }

  function pad(number) {
    return number < 10 ? '0' + number : String(number);
  }

  function formatUtc(date) {
    return pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ' UTC';
  }

  function parseTime(value) {
    var timestamp = Date.parse(value || '');
    return isFinite(timestamp) ? timestamp : 0;
  }

  function clearTrack() {
    while (track.firstChild) {
      track.removeChild(track.firstChild);
    }
  }

  function setStaticState() {
    track.classList.add('is-static');
  }

  function setScrollingState() {
    track.classList.remove('is-static');
  }

  function setTickerState(state) {
    ticker.dataset.state = state;
  }

  function appendMessage(text) {
    clearTrack();
    setStaticState();

    var message = document.createElement('span');
    message.className = 'live-alert-ticker-empty';
    message.textContent = text;
    track.appendChild(message);
  }

  function appendScrollingMessage(text) {
    clearTrack();
    setScrollingState();

    var first = document.createElement('span');
    var second = document.createElement('span');

    first.className = 'live-alert-ticker-empty';
    second.className = 'live-alert-ticker-empty';
    first.textContent = text;
    second.textContent = text;
    second.setAttribute('aria-hidden', 'true');

    track.appendChild(first);
    track.appendChild(second);
  }

  function buildAlertItem(feature) {
    var properties = feature && feature.properties ? feature.properties : {};
    var item = document.createElement('span');
    var dot = document.createElement('span');
    var event = document.createElement('span');
    var area = document.createElement('span');

    item.className = 'live-alert-ticker-item';
    item.dataset.level = /Watch$/.test(properties.event || '') ? 'watch' : 'warning';
    dot.className = 'live-alert-ticker-item-dot';
    dot.setAttribute('aria-hidden', 'true');
    event.className = 'live-alert-ticker-item-event';
    area.className = 'live-alert-ticker-item-area';

    event.textContent = eventLabels[properties.event] || properties.event || strings.alert;
    area.textContent = properties.areaDesc || strings.affectedArea;

    item.appendChild(dot);
    item.appendChild(event);
    item.appendChild(area);
    return item;
  }

  function renderAlerts(features) {
    clearTrack();

    if (!features.length) {
      setTickerState('empty');
      appendScrollingMessage(strings.empty);
      return;
    }

    setTickerState('ready');
    setScrollingState();

    var fragment = document.createDocumentFragment();
    var visibleFeatures = features.slice(0, maxAlerts);
    var items = visibleFeatures.map(buildAlertItem);

    items.forEach(function (item) {
      fragment.appendChild(item);
    });

    items.forEach(function (item) {
      var visualClone = item.cloneNode(true);
      visualClone.setAttribute('aria-hidden', 'true');
      fragment.appendChild(visualClone);
    });

    track.appendChild(fragment);
  }

  function normalizeAlerts(data) {
    var seen = Object.create(null);

    return ((data && data.features) || [])
      .filter(function (feature) {
        var properties = feature && feature.properties ? feature.properties : {};
        var eventName = properties.event || '';
        var identifier = feature.id || properties.id || properties['@id'] || [eventName, properties.areaDesc, properties.sent].join('|');

        if (!Object.prototype.hasOwnProperty.call(eventPriority, eventName)) {
          return false;
        }

        if (seen[identifier]) {
          return false;
        }

        seen[identifier] = true;
        return true;
      })
      .sort(function (left, right) {
        var leftProperties = left.properties || {};
        var rightProperties = right.properties || {};
        var leftPriority = Object.prototype.hasOwnProperty.call(eventPriority, leftProperties.event)
          ? eventPriority[leftProperties.event]
          : 999;
        var rightPriority = Object.prototype.hasOwnProperty.call(eventPriority, rightProperties.event)
          ? eventPriority[rightProperties.event]
          : 999;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        var rightTime = parseTime(rightProperties.effective || rightProperties.sent);
        var leftTime = parseTime(leftProperties.effective || leftProperties.sent);

        if (rightTime !== leftTime) {
          return rightTime - leftTime;
        }

        return String(leftProperties.areaDesc || '').localeCompare(String(rightProperties.areaDesc || ''));
      });
  }

  function updateReadout() {
    readout.textContent = strings.updated + formatUtc(new Date());
  }

  function handleFailure(error) {
    inFlight = false;
    setTickerState('error');
    appendMessage(strings.failure);
    readout.textContent = strings.unavailable;
    if (window.console && window.console.warn) {
      window.console.warn('Live tropical alerts ticker fetch failed:', error);
    }
  }

  function handleSuccess(data) {
    inFlight = false;
    renderAlerts(normalizeAlerts(data));
    updateReadout();
  }

  function refresh(force) {
    var now = Date.now();

    if (inFlight) {
      return;
    }

    if (!force && now - lastRefreshStartedAt < visibilityThrottleMs) {
      return;
    }

    inFlight = true;
    lastRefreshStartedAt = now;
    setTickerState('loading');
    appendScrollingMessage(strings.loading);
    readout.textContent = strings.connecting;

    var request = new XMLHttpRequest();

    request.open('GET', endpoint, true);
    request.setRequestHeader('Accept', 'application/geo+json');
    request.timeout = 12000;

    request.onreadystatechange = function () {
      if (request.readyState !== 4) {
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        handleFailure(new Error('HTTP ' + request.status));
        return;
      }

      try {
        handleSuccess(JSON.parse(request.responseText));
      } catch (error) {
        handleFailure(error);
      }
    };

    request.onerror = function () {
      handleFailure(new Error('Network error'));
    };

    request.ontimeout = function () {
      handleFailure(new Error('Request timed out'));
    };

    request.send(null);
  }

  refresh(true);
  window.setInterval(function () {
    refresh(true);
  }, refreshMs);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      refresh(false);
    }
  });
})();

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
    dot.className = 'live-alert-ticker-item-dot';
    dot.setAttribute('aria-hidden', 'true');
    event.className = 'live-alert-ticker-item-event';
    area.className = 'live-alert-ticker-item-area';

    event.textContent = properties.event || 'Alert';
    area.textContent = properties.areaDesc || 'Affected area';

    item.appendChild(dot);
    item.appendChild(event);
    item.appendChild(area);
    return item;
  }

  function renderAlerts(features) {
    clearTrack();

    if (!features.length) {
      appendScrollingMessage('No active NWS tropical alerts right now.');
      return;
    }

    setScrollingState();

    var fragment = document.createDocumentFragment();
    var visibleFeatures = features.slice(0, maxAlerts);
    var items = visibleFeatures.map(buildAlertItem);

    items.forEach(function (item) {
      fragment.appendChild(item);
    });

    items.forEach(function (item) {
      fragment.appendChild(item.cloneNode(true));
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
    readout.textContent = 'NWS · Updated ' + formatUtc(new Date());
  }

  function handleFailure(error) {
    inFlight = false;
    var reason = error && error.message ? error.message : 'Unknown error';
    appendMessage('Unable to load live NWS tropical alerts right now. ' + reason + '.');
    readout.textContent = 'NWS · ' + reason;
    window.console.warn('Live tropical alerts ticker fetch failed:', error);
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
    appendScrollingMessage('Loading live NWS tropical alerts…');
    readout.textContent = 'NWS · Connecting…';

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

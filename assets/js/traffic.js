(function () {
  var endpointMeta = document.querySelector('meta[name="hurricane-traffic-endpoint"]');
  var endpoint = endpointMeta && endpointMeta.content ? endpointMeta.content.trim() : "";

  if (!endpoint || navigator.doNotTrack === "1") {
    return;
  }

  var payload = {
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
    search: window.location.search.slice(0, 512)
  };

  function sendTrafficEvent() {
    var body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }

    window.fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body,
      keepalive: true,
      credentials: "omit"
    }).catch(function () {});
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(sendTrafficEvent, { timeout: 2000 });
  } else {
    window.setTimeout(sendTrafficEvent, 500);
  }
})();

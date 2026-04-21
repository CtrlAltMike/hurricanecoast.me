(function () {
  if (!window.location || !/^https?:$/.test(window.location.protocol)) {
    return;
  }

  var hostname = window.location.hostname;
  var isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

  function normalizeLocalPath(pathname) {
    if (!pathname || pathname === '/') {
      return '/index.html';
    }

    if (pathname.endsWith('/')) {
      return pathname + 'index.html';
    }

    var lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
    if (!lastSegment || lastSegment.indexOf('.') !== -1) {
      return pathname;
    }

    return pathname + '.html';
  }

  if (isLocalHost) {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href[0] === '#') {
        return;
      }

      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      var nextPath = normalizeLocalPath(url.pathname);
      if (nextPath === url.pathname) {
        return;
      }

      link.setAttribute('href', nextPath + url.search + url.hash);
    });
    return;
  }

  var path = window.location.pathname;
  var nextPath = path;

  if (path === '/index.html') {
    nextPath = '/';
  } else if (path.endsWith('/index.html')) {
    nextPath = path.slice(0, -'index.html'.length);
  } else if (path.endsWith('.html')) {
    nextPath = path.slice(0, -'.html'.length);
  }

  if (!nextPath || nextPath === path) {
    return;
  }

  window.location.replace(nextPath + window.location.search + window.location.hash);
})();

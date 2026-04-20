(function () {
  if (!window.location || !/^https?:$/.test(window.location.protocol)) {
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

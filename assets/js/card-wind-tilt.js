(function () {
  window.HSLCardWindTiltScriptLoaded = true;

  if (!window.matchMedia) {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  var cards = Array.prototype.slice.call(
    document.querySelectorAll('.state-card, .directory-card, .kit-card')
  );
  var tiltSurfaces = Array.prototype.slice.call(
    document.querySelectorAll('.state-grid, .directory-grid, .kit-grid, .state-card, .directory-card, .kit-card')
  );

  if (!cards.length) {
    return;
  }

  window.HSLCardWindTiltBooted = true;

  var lastX = null;
  var lastY = null;
  var FALLOFF = 420;
  var MAX_DEG = 6;
  var OFFSCREEN_BUFFER = 200;

  function clearCards() {
    cards.forEach(function (card) {
      card.style.transform = '';
    });
  }

  function resetTilt() {
    lastX = null;
    lastY = null;
    clearCards();
  }

  function frame() {
    if (lastX === null || lastY === null) {
      clearCards();
      return;
    }

    cards.forEach(function (card) {
      var rect = card.getBoundingClientRect();

      if (rect.bottom < -OFFSCREEN_BUFFER || rect.top > window.innerHeight + OFFSCREEN_BUFFER) {
        card.style.transform = '';
        return;
      }

      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var dx = lastX - centerX;
      var dy = lastY - centerY;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > FALLOFF) {
        card.style.transform = '';
        return;
      }

      var influence = 1 - distance / FALLOFF;
      var nx = dx / (distance || 1);
      var ny = dy / (distance || 1);
      var rotY = nx * MAX_DEG * influence;
      var rotX = -ny * MAX_DEG * influence;

      card.style.transform =
        'rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
    });
  }

  function handleMove(event) {
    if (event.pointerType === 'touch') {
      resetTilt();
      return;
    }

    lastX = event.clientX;
    lastY = event.clientY;
    frame();
  }

  document.addEventListener('pointermove', handleMove, { passive: true, capture: true });
  document.addEventListener('mousemove', handleMove, { passive: true, capture: true });
  tiltSurfaces.forEach(function (surface) {
    surface.addEventListener('pointermove', handleMove, { passive: true });
    surface.addEventListener('mousemove', handleMove, { passive: true });
  });
  window.addEventListener('scroll', frame, { passive: true });
  window.addEventListener('resize', frame, { passive: true });
  window.addEventListener('blur', resetTilt);
  document.addEventListener('pointerleave', resetTilt);
  document.addEventListener('mouseleave', resetTilt);
})();

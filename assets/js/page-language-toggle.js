/* page-language-toggle.js - toggles page-specific bilingual content panels */

(function () {
  'use strict';

  function getButtons() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-page-language-btn]'));
  }

  function getPanels() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-page-language-panel]'));
  }

  function normalizeLanguage(value) {
    return value === 'es' ? 'es' : 'en';
  }

  function setLanguage(lang) {
    const activeLanguage = normalizeLanguage(lang);

    getButtons().forEach(function (button) {
      const isActive = button.getAttribute('data-page-language-btn') === activeLanguage;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    getPanels().forEach(function (panel) {
      const isActive = panel.getAttribute('data-page-language-panel') === activeLanguage;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
    });

    if (window.history && window.history.replaceState) {
      const url = new URL(window.location.href);

      if (activeLanguage === 'es') {
        url.searchParams.set('lang', 'es');
      } else {
        url.searchParams.delete('lang');
      }

      window.history.replaceState({}, '', url.toString());
    }
  }

  function getInitialLanguage() {
    const url = new URL(window.location.href);
    return normalizeLanguage(url.searchParams.get('lang'));
  }

  function init() {
    const buttons = getButtons();
    const panels = getPanels();

    if (!buttons.length || !panels.length) {
      return;
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        setLanguage(button.getAttribute('data-page-language-btn'));
      });
    });

    setLanguage(getInitialLanguage());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

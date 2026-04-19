/* share.js — native share buttons plus guide-end support prompts */

(function () {
  'use strict';

  const shareIcon = [
    '<svg class="share-icon" viewBox="0 0 24 24" aria-hidden="true">',
    '  <circle cx="18" cy="5" r="2.5"></circle>',
    '  <circle cx="6" cy="12" r="2.5"></circle>',
    '  <circle cx="18" cy="19" r="2.5"></circle>',
    '  <path d="M8.2 10.9L15.8 6.1"></path>',
    '  <path d="M8.2 13.1L15.8 17.9"></path>',
    '</svg>',
    '<span class="sr-only">Share this page</span>'
  ].join('');

  let liveRegion;

  function getMetaContent(selector) {
    const element = document.querySelector(selector);
    return element && element.content ? element.content.trim() : '';
  }

  function getShareTitle() {
    return (
      getMetaContent('meta[property="og:title"]') ||
      document.title.replace(/\s+[-—–]\s+hurricanesupplylist\.com$/i, '').trim()
    );
  }

  function getShareText() {
    return (
      getMetaContent('meta[name="description"]') ||
      getMetaContent('meta[property="og:description"]')
    );
  }

  function getShareURL() {
    const canonical = document.querySelector('link[rel="canonical"]');
    return canonical && canonical.href ? canonical.href : window.location.href;
  }

  function getShareData() {
    const shareData = {
      title: getShareTitle(),
      text: getShareText(),
      url: getShareURL()
    };

    if (!shareData.text) {
      delete shareData.text;
    }

    return shareData;
  }

  function ensureLiveRegion() {
    if (liveRegion) {
      return liveRegion;
    }

    liveRegion = document.createElement('div');
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveRegion);
    return liveRegion;
  }

  function announce(message) {
    const region = ensureLiveRegion();
    region.textContent = '';
    window.setTimeout(function () {
      region.textContent = message;
    }, 30);
  }

  function setConfirmedState() {
    document.querySelectorAll('.share-button').forEach(function (button) {
      button.classList.add('is-confirmed');
      button.setAttribute('aria-label', 'Link copied');
      button.setAttribute('title', 'Link copied');
    });

    window.setTimeout(function () {
      document.querySelectorAll('.share-button').forEach(function (button) {
        button.classList.remove('is-confirmed');
        button.setAttribute('aria-label', 'Share this page');
        button.setAttribute('title', 'Share this page');
      });
    }, 1600);
  }

  async function copyLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }

    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.style.position = 'absolute';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, field.value.length);

    const copied = document.execCommand('copy');
    document.body.removeChild(field);
    return copied;
  }

  async function handleShare() {
    const shareData = getShareData();

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return;
      }
    }

    try {
      await copyLink(shareData.url);
      setConfirmedState();
      announce('Link copied to clipboard');
    } catch (error) {
      window.prompt('Copy this link:', shareData.url);
    }
  }

  function createShareButton(className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'share-button ' + className;
    button.setAttribute('aria-label', 'Share this page');
    button.setAttribute('title', 'Share this page');
    button.innerHTML = shareIcon;
    button.addEventListener('click', handleShare);
    return button;
  }

  function createSupportCard() {
    const card = document.createElement('section');
    card.className = 'support-card';
    card.setAttribute('aria-label', 'Support this site');
    card.innerHTML = [
      '<p class="support-card-eyebrow">Support this site</p>',
      '<h3>If this guide helped, keep it going.</h3>',
      '<p>No ads. No affiliate links. If this made your hurricane prep clearer, you can help keep the site free and up to date.</p>',
      '<div class="btn-row"><a href="https://ko-fi.com/mikehen" class="btn btn-secondary" target="_blank" rel="noopener">Support on Ko-fi</a></div>'
    ].join('');
    return card;
  }

  function createRadar() {
    const el = document.createElement('div');
    el.className = 'fx-radar';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = [
      '<svg viewBox="-50 -50 100 100">',
      '<circle r="48" fill="rgba(58,107,131,.05)" stroke="rgba(58,107,131,.32)" stroke-width="1"/>',
      '<circle r="34" fill="none" stroke="rgba(58,107,131,.32)" stroke-width=".6" stroke-dasharray="2 3"/>',
      '<circle r="20" fill="none" stroke="rgba(58,107,131,.32)" stroke-width=".6" stroke-dasharray="2 3"/>',
      '<g stroke="rgba(58,107,131,.22)" stroke-width=".5">',
        '<line x1="-48" y1="0" x2="48" y2="0"/>',
        '<line x1="0" y1="-48" x2="0" y2="48"/>',
      '</g>',
      '<defs><linearGradient id="fxSweepGrad" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">',
        '<stop offset="0" stop-color="#3A6B83" stop-opacity="0"/>',
        '<stop offset=".55" stop-color="#3A6B83" stop-opacity=".25"/>',
        '<stop offset="1" stop-color="#3A6B83" stop-opacity=".9"/>',
      '</linearGradient></defs>',
      '<g class="fx-sweep">',
        '<path d="M 0 0 L 48 0" stroke="url(#fxSweepGrad)" stroke-width="2.6" stroke-linecap="round"/>',
        '<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3.5s" repeatCount="indefinite"/>',
      '</g>',
      '<circle r="1.5" fill="#3A6B83" fill-opacity=".55"/>',
      '</svg>'
    ].join('');
    return el;
  }

  function initShareButtons() {
    const navContainer = document.querySelector('.site-nav .container-wide');

    if (navContainer && !navContainer.querySelector('.nav-share-btn')) {
      navContainer.appendChild(createShareButton('nav-share-btn'));
    }

    if (document.body && !document.querySelector('.floating-share-btn')) {
      document.body.appendChild(createShareButton('floating-share-btn'));
    }

    if (document.body && !document.querySelector('.fx-radar')) {
      document.body.appendChild(createRadar());
    }
  }

  function initGuideSupportCard() {
    const guideArticle = document.querySelector('.share-sticky-wrap article.container');

    if (!guideArticle || document.querySelector('.share-sticky-wrap .support-card')) {
      return;
    }

    const relatedKits = guideArticle.querySelector('.related-kits');
    const supportCard = createSupportCard();

    if (relatedKits && relatedKits.parentNode === guideArticle) {
      relatedKits.insertAdjacentElement('afterend', supportCard);
      return;
    }

    guideArticle.appendChild(supportCard);
  }

  window.HurricaneShare = {
    copyLink: copyLink,
    createSupportCard: createSupportCard,
    createShareButton: createShareButton,
    getShareData: getShareData,
    initGuideSupportCard: initGuideSupportCard,
    initShareButtons: initShareButtons,
    setConfirmedState: setConfirmedState
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initShareButtons();
      initGuideSupportCard();
    });
  } else {
    initShareButtons();
    initGuideSupportCard();
  }
})();

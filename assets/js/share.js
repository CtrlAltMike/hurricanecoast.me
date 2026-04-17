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

  function initShareButtons() {
    const navContainer = document.querySelector('.site-nav .container-wide');

    if (navContainer && !navContainer.querySelector('.nav-share-btn')) {
      navContainer.appendChild(createShareButton('nav-share-btn'));
    }

    if (document.body && !document.querySelector('.floating-share-btn')) {
      document.body.appendChild(createShareButton('floating-share-btn'));
    }
  }

  function initGuideSupportCard() {
    const shareRow = document.querySelector('article.container .share-row');

    if (!shareRow || document.querySelector('.support-card')) {
      return;
    }

    shareRow.parentNode.insertBefore(createSupportCard(), shareRow);
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

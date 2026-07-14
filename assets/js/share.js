/* share.js — native share controls plus guide-end support prompts */

(function () {
  'use strict';

  const STRINGS = {
    en: {
      share: 'Share',
      sharePage: 'Share this page',
      shareOptions: 'Page sharing options',
      copied: 'Copied',
      linkCopied: 'Link copied',
      linkCopiedAnnouncement: 'Link copied to clipboard',
      copyPrompt: 'Copy this link:',
      emailPage: 'Share this page by email',
      smsPage: 'Share this page by text message',
      copyPage: 'Copy link to this page',
      supportLabel: 'Support this site',
      supportEyebrow: 'Support this site',
      supportTitle: 'If this guide helped, keep it going.',
      supportCopy: 'No ads. No affiliate links. If this made your hurricane prep clearer, you can help keep the site free and up to date.',
      supportAction: 'Support on Ko-fi'
    },
    es: {
      share: 'Compartir',
      sharePage: 'Compartir esta página',
      shareOptions: 'Opciones para compartir la página',
      copied: 'Copiado',
      linkCopied: 'Enlace copiado',
      linkCopiedAnnouncement: 'Enlace copiado al portapapeles',
      copyPrompt: 'Copie este enlace:',
      emailPage: 'Compartir esta página por correo electrónico',
      smsPage: 'Compartir esta página por mensaje de texto',
      copyPage: 'Copiar el enlace de esta página',
      supportLabel: 'Apoye este sitio',
      supportEyebrow: 'Apoye este sitio',
      supportTitle: 'Si esta guía le ayudó, ayude a mantenerla disponible.',
      supportCopy: 'Sin anuncios ni enlaces de afiliados. Si esta guía aclaró su preparación para huracanes, puede ayudar a mantener el sitio gratuito y actualizado.',
      supportAction: 'Apoyar en Ko-fi'
    }
  };

  const shareIcon = [
    '<svg class="share-icon" viewBox="0 0 24 24" aria-hidden="true">',
    '  <circle cx="18" cy="5" r="2.5"></circle>',
    '  <circle cx="6" cy="12" r="2.5"></circle>',
    '  <circle cx="18" cy="19" r="2.5"></circle>',
    '  <path d="M8.2 10.9L15.8 6.1"></path>',
    '  <path d="M8.2 13.1L15.8 17.9"></path>',
    '</svg>'
  ].join('');

  let liveRegion;

  function getLanguage() {
    const language = (document.documentElement.lang || 'en').toLowerCase();
    return language === 'es' || language.indexOf('es-') === 0 ? 'es' : 'en';
  }

  function getStrings() {
    return STRINGS[getLanguage()];
  }

  function getMetaContent(selector) {
    const element = document.querySelector(selector);
    return element && element.content ? element.content.trim() : '';
  }

  function getShareTitle() {
    return (
      getMetaContent('meta[property="og:title"]') ||
      document.title.replace(/\s+[-—–]\s+(?:Hurricane Coast|hurricanecoast\.me)$/i, '').trim()
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

  function buildEmailURL(title, url) {
    return 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(url);
  }

  function buildSmsURL(title, url) {
    return 'sms:?body=' + encodeURIComponent(title + ' ' + url);
  }

  function ensureLiveRegion() {
    if (liveRegion) {
      return liveRegion;
    }

    liveRegion = document.createElement('div');
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
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

  function setButtonLabel(button, label, visibleLabel) {
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);

    const text = button.querySelector('.share-button-text');
    if (text) {
      text.textContent = visibleLabel || label;
    }
  }

  function setConfirmedState() {
    const strings = getStrings();

    document.querySelectorAll('.share-button').forEach(function (button) {
      button.classList.add('is-confirmed');
      setButtonLabel(button, strings.linkCopied, strings.copied);
    });

    window.setTimeout(function () {
      document.querySelectorAll('.share-button').forEach(function (button) {
        button.classList.remove('is-confirmed');
        setButtonLabel(button, strings.sharePage, strings.share);
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

    if (!copied) {
      throw new Error('copy_failed');
    }

    return true;
  }

  async function handleShare() {
    const shareData = getShareData();
    const strings = getStrings();

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
      announce(strings.linkCopiedAnnouncement);
    } catch (error) {
      window.prompt(strings.copyPrompt, shareData.url);
    }
  }

  function createShareButton(className, showText) {
    const strings = getStrings();
    const button = document.createElement('button');
    const textClass = showText ? 'share-button-text' : 'share-button-text sr-only';

    button.type = 'button';
    button.className = 'share-button ' + className;
    button.setAttribute('aria-label', strings.sharePage);
    button.setAttribute('title', strings.sharePage);
    button.innerHTML = shareIcon + '<span class="' + textClass + '">' + strings.share + '</span>';
    button.addEventListener('click', handleShare);
    return button;
  }

  function createSupportCard() {
    const strings = getStrings();
    const card = document.createElement('section');
    card.className = 'support-card';
    card.setAttribute('aria-label', strings.supportLabel);
    card.innerHTML = [
      '<p class="support-card-eyebrow">' + strings.supportEyebrow + '</p>',
      '<h3>' + strings.supportTitle + '</h3>',
      '<p>' + strings.supportCopy + '</p>',
      '<div class="btn-row"><a href="https://ko-fi.com/mikehen" class="btn btn-secondary" target="_blank" rel="noopener">' + strings.supportAction + '</a></div>'
    ].join('');
    return card;
  }

  function initShareRow(row) {
    if (!row || row.dataset.shareReady === 'true') {
      return;
    }

    const strings = getStrings();
    const shareData = getShareData();
    const email = row.querySelector('[data-share="email"]');
    const sms = row.querySelector('[data-share="sms"]');
    const copy = row.querySelector('[data-share="copy"]');

    if (email) {
      email.href = buildEmailURL(shareData.title, shareData.url);
      email.setAttribute('aria-label', strings.emailPage);
    }

    if (sms) {
      sms.href = buildSmsURL(shareData.title, shareData.url);
      sms.setAttribute('aria-label', strings.smsPage);
    }

    if (copy) {
      copy.setAttribute('aria-label', strings.copyPage);
      copy.addEventListener('click', function (event) {
        event.preventDefault();
        copyLink(shareData.url).then(function () {
          setConfirmedState();
          announce(strings.linkCopiedAnnouncement);
        }).catch(function () {
          window.prompt(strings.copyPrompt, shareData.url);
        });
      });
    }

    row.dataset.shareReady = 'true';
  }

  function removeDeprecatedShareUI() {
    document.querySelectorAll('.floating-share-btn, .fx-radar').forEach(function (element) {
      element.remove();
    });
  }

  function initInlineShareButtons() {
    const strings = getStrings();

    document.querySelectorAll('.share-sticky-wrap article.container').forEach(function (article) {
      if (article.querySelector('.inline-share-row')) {
        return;
      }

      const row = document.createElement('div');
      row.className = 'inline-share-row';
      row.setAttribute('aria-label', strings.shareOptions);
      row.appendChild(createShareButton('inline-share-btn', true));
      article.insertBefore(row, article.firstChild);
    });
  }

  function initShareButtons() {
    const navContainer = document.querySelector('.site-nav .container-wide');

    removeDeprecatedShareUI();

    if (navContainer && !navContainer.querySelector('.nav-share-btn')) {
      navContainer.appendChild(createShareButton('nav-share-btn', false));
    }

    initInlineShareButtons();
    document.querySelectorAll('.share-row').forEach(initShareRow);
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
    buildEmailURL: buildEmailURL,
    buildSmsURL: buildSmsURL,
    copyLink: copyLink,
    createSupportCard: createSupportCard,
    createShareButton: createShareButton,
    getLanguage: getLanguage,
    getShareData: getShareData,
    initGuideSupportCard: initGuideSupportCard,
    initInlineShareButtons: initInlineShareButtons,
    initShareButtons: initShareButtons,
    initShareRow: initShareRow,
    setConfirmedState: setConfirmedState
  };

  function init() {
    initShareButtons();
    initGuideSupportCard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

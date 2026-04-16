/* share.js — social share buttons */

function buildTwitterURL(title, url) {
  return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url);
}

function buildFacebookURL(url) {
  return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
}

function buildEmailURL(title, url) {
  return 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(url);
}

function buildSmsURL(title, url) {
  return 'sms:?body=' + encodeURIComponent(title + ' ' + url);
}

function initShareRow(row) {
  const pageTitle = document.title.replace(/\s*[—–-].*$/, '').trim();
  const pageURL = window.location.href;

  const buttons = {
    '[data-share="twitter"]':  buildTwitterURL(pageTitle, pageURL),
    '[data-share="facebook"]': buildFacebookURL(pageURL),
    '[data-share="email"]':    buildEmailURL(pageTitle, pageURL),
    '[data-share="sms"]':      buildSmsURL(pageTitle, pageURL),
  };

  Object.entries(buttons).forEach(([selector, href]) => {
    const btn = row.querySelector(selector);
    if (btn) btn.href = href;
  });

  const copyBtn = row.querySelector('[data-share="copy"]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      navigator.clipboard.writeText(pageURL).then(function () {
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = original; }, 1500);
      });
    });
  }
}

function initShare() {
  document.querySelectorAll('.share-row').forEach(initShareRow);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShare);
} else {
  initShare();
}

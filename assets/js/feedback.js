/* ============================================================
   Hurricane Coast — Feedback Widget
   Private reader feedback queue for moderated testimonials
   ============================================================ */

(function() {
  'use strict';

  const MAX_MESSAGE_LENGTH = 400;

  const STRINGS = {
    en: {
      launcher: 'Feedback',
      title: 'Share feedback',
      close: 'Close feedback form',
      name: 'First name or initials',
      optional: 'optional',
      namePlaceholder: 'Alex or A.R.',
      message: 'Your feedback',
      messagePlaceholder: 'What helped, what was unclear, or what should be added?',
      canQuote: 'Quote may be used publicly.',
      submit: 'Send feedback',
      missingMessage: 'Please add a short note before sending.',
      sending: 'Sending…',
      success: 'Thanks. Your note was sent for review.',
      failure: 'Sorry, that did not send. Please try again.'
    },
    es: {
      launcher: 'Comentarios',
      title: 'Comparta sus comentarios',
      close: 'Cerrar el formulario de comentarios',
      name: 'Nombre o iniciales',
      optional: 'opcional',
      namePlaceholder: 'Alex o A.R.',
      message: 'Sus comentarios',
      messagePlaceholder: '¿Qué le ayudó, qué no quedó claro o qué debería añadirse?',
      canQuote: 'Sus comentarios pueden citarse públicamente.',
      submit: 'Enviar comentarios',
      missingMessage: 'Escriba una nota breve antes de enviarla.',
      sending: 'Enviando…',
      success: 'Gracias. Su nota se envió para revisión.',
      failure: 'Lo sentimos, no se pudo enviar. Inténtelo de nuevo.'
    }
  };

  const icon = `
    <svg class="feedback-widget-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v4A3.5 3.5 0 0 1 15.5 14H12l-4.5 4v-4A3.5 3.5 0 0 1 4 10.5z"></path>
    </svg>
  `;

  let launcher;
  let panel;
  let status;
  let widgetRoot;
  let previousFocus;

  function getLanguage() {
    const language = (document.documentElement.lang || 'en').toLowerCase();
    return language === 'es' || language.indexOf('es-') === 0 ? 'es' : 'en';
  }

  function getStrings() {
    return STRINGS[getLanguage()];
  }

  function getEndpoint() {
    const endpointMeta = document.querySelector('meta[name="hurricane-feedback-endpoint"]');
    return endpointMeta && endpointMeta.content ? endpointMeta.content.trim() : '';
  }

  function getPageTitle() {
    return document.title.replace(/\s+[-—|]\s+(?:Hurricane Coast|hurricanecoast\.me)$/i, '').trim();
  }

  function createWidget() {
    const endpoint = getEndpoint();
    if (!endpoint || document.querySelector('.feedback-widget')) {
      return;
    }

    const strings = getStrings();

    widgetRoot = document.createElement('div');
    widgetRoot.className = 'feedback-widget';

    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'feedback-widget-launcher';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'feedback-widget-panel');
    launcher.setAttribute('aria-label', strings.launcher);
    launcher.innerHTML = `${icon}<span>${strings.launcher}</span>`;

    panel = document.createElement('section');
    panel.className = 'feedback-widget-panel';
    panel.id = 'feedback-widget-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'feedback-widget-title');
    panel.hidden = true;
    panel.innerHTML = `
      <div class="feedback-widget-header">
        <h2 id="feedback-widget-title">${strings.title}</h2>
        <button type="button" class="feedback-widget-close" aria-label="${strings.close}">&times;</button>
      </div>
      <form class="feedback-widget-form">
        <label for="feedback-widget-name">${strings.name} <span>${strings.optional}</span></label>
        <input id="feedback-widget-name" name="name" type="text" maxlength="40" autocomplete="given-name" placeholder="${strings.namePlaceholder}">

        <label for="feedback-widget-message">${strings.message}</label>
        <textarea id="feedback-widget-message" name="message" maxlength="${MAX_MESSAGE_LENGTH}" required placeholder="${strings.messagePlaceholder}"></textarea>
        <div class="feedback-widget-count" aria-live="polite">0/${MAX_MESSAGE_LENGTH}</div>

        <label class="feedback-widget-check">
          <input name="canQuote" type="checkbox">
          <span>${strings.canQuote}</span>
        </label>

        <div class="feedback-widget-actions">
          <button type="submit" class="feedback-widget-submit">${strings.submit}</button>
        </div>
        <p class="feedback-widget-status" aria-live="polite"></p>
      </form>
    `;

    widgetRoot.appendChild(launcher);
    widgetRoot.appendChild(panel);
    document.body.appendChild(widgetRoot);

    status = panel.querySelector('.feedback-widget-status');
    bindWidget(endpoint);
  }

  function bindWidget(endpoint) {
    const closeButton = panel.querySelector('.feedback-widget-close');
    const form = panel.querySelector('.feedback-widget-form');
    const message = panel.querySelector('#feedback-widget-message');
    const counter = panel.querySelector('.feedback-widget-count');

    launcher.addEventListener('click', openPanel);
    closeButton.addEventListener('click', closePanel);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) {
        closePanel();
      }
    });

    message.addEventListener('input', () => {
      counter.textContent = `${message.value.length}/${MAX_MESSAGE_LENGTH}`;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await submitFeedback(endpoint, form);
    });
  }

  function openPanel() {
    previousFocus = document.activeElement;
    panel.hidden = false;
    widgetRoot.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    panel.querySelector('#feedback-widget-message').focus();
  }

  function closePanel() {
    panel.hidden = true;
    widgetRoot.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    } else {
      launcher.focus();
    }
  }

  async function submitFeedback(endpoint, form) {
    const submit = form.querySelector('.feedback-widget-submit');
    const data = new FormData(form);
    const message = String(data.get('message') || '').trim();
    const strings = getStrings();

    if (!message) {
      setStatus(strings.missingMessage, 'error');
      return;
    }

    submit.disabled = true;
    setStatus(strings.sending, '');

    try {
      const response = await window.fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') || '').trim(),
          message,
          canQuote: data.get('canQuote') === 'on',
          path: window.location.pathname,
          pageTitle: getPageTitle()
        }),
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error('feedback_failed');
      }

      form.reset();
      form.querySelector('.feedback-widget-count').textContent = `0/${MAX_MESSAGE_LENGTH}`;
      setStatus(strings.success, 'success');
    } catch (error) {
      setStatus(strings.failure, 'error');
    } finally {
      submit.disabled = false;
    }
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.dataset.state = type;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();

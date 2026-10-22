import { validateFields } from './validation.js';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width:980px)');
const menu = document.querySelector('#site-menu');
const toggle = document.querySelector('#menu-toggle');
if (menu && toggle && typeof menu.showModal === 'function') {
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    menu.showModal(); toggle.setAttribute('aria-expanded','true'); document.body.classList.add('menu-open');
  });
  menu.querySelector('.menu-close').addEventListener('click', () => menu.close());
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.close()));
  menu.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open'); toggle.focus({preventScroll:true});
  });
}
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), {threshold:0.03});
  document.querySelectorAll('[data-reveal]').forEach(section => observer.observe(section));
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) { document.documentElement.classList.remove('js-motion'); observer.disconnect(); }
  });
}
const parallax = document.querySelector('[data-parallax]');
if (parallax) {
  let pending = false;
  const draw = () => {
    parallax.style.transform = reducedMotion.matches || mobile.matches ? 'none' : `translate3d(0,${Math.min(window.scrollY,900)*0.08}px,0)`;
    pending = false;
  };
  window.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(draw); } }, {passive:true});
  reducedMotion.addEventListener('change',draw); mobile.addEventListener('change',draw); draw();
}
const form = document.querySelector('#waitlist-form');
if (form) {
  form.noValidate = true; // Keep HTML constraints for the non-JavaScript submission path.
  const button = form.querySelector('[type=submit]');
  const errorSummary = form.querySelector('#form-error');
  const errorMessage = form.querySelector('#form-error-message');
  const errorList = form.querySelector('#form-error-list');
  const status = form.querySelector('#form-status');
  let submitting = false;
  let attempted = false;
  const fields = [...form.querySelectorAll('input:not([type=checkbox]):not([name=website]),select')];
  const payload = () => {
    const data = new FormData(form);
    return {...Object.fromEntries(data),interests:data.getAll('interests')};
  };
  const showFieldError = (field,message) => {
    const error = document.getElementById(`${field.id}-error`);
    if (!error) return;
    field.setAttribute('aria-invalid',message ? 'true':'false');
    error.textContent = message || ''; error.hidden = !message;
    if (message && field.closest('details')) field.closest('details').open = true;
  };
  const showErrors = (errors,message = 'Please check the highlighted fields.') => {
    fields.forEach(field => showFieldError(field,errors[field.name]));
    errorList.replaceChildren();
    for (const [name,text] of Object.entries(errors)) {
      const field = form.elements.namedItem(name);
      if (!(field instanceof HTMLElement)) continue;
      const item = document.createElement('li'); const link = document.createElement('a');
      link.href = `#${field.id}`; link.textContent = text;
      link.addEventListener('click',event => { event.preventDefault(); field.focus(); });
      item.append(link); errorList.append(item);
    }
    errorMessage.textContent = message; errorSummary.hidden = false;
    const first = fields.find(field => errors[field.name]);
    (first || errorSummary).focus();
  };
  fields.forEach(field => {
    field.addEventListener('blur', () => showFieldError(field,validateFields(payload())[field.name]));
    field.addEventListener(field.tagName === 'SELECT' ? 'change':'input', () => {
      if (attempted || field.getAttribute('aria-invalid') === 'true') showFieldError(field,validateFields(payload())[field.name]);
      // An old summary should not keep claiming that already-corrected values are invalid.
      errorSummary.hidden = true;
    });
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (submitting) return; attempted = true;
    fields.forEach(field => { field.value = field.value.trim(); });
    const data = payload(); const errors = validateFields(data);
    if (Object.keys(errors).length) { showErrors(errors); return; }
    errorSummary.hidden = true;
    submitting = true; button.disabled = true; form.setAttribute('aria-busy','true');
    const originalText = button.textContent; button.textContent = 'SENDING…'; status.textContent = 'Sending your signup…';
    const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(),20000);
    try {
      const response = await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        showErrors(result.fields || {},result.error || 'Your signup could not be sent. Please try again, or email hello@lysrosebabyspa.com.');
        return;
      }
      const success = document.createElement('div'); success.className = 'form-success'; success.tabIndex = -1; success.setAttribute('role','status');
      const message = document.createElement('p'); message.textContent = "Thank you, you're on the list. We'll email you as soon as sessions open.";
      success.append(message); form.replaceChildren(success); success.focus();
    } catch (error) {
      showErrors({},error?.name === 'AbortError'
        ? 'The request timed out and may have reached us. Please email hello@lysrosebabyspa.com before submitting again.'
        : 'We could not connect. Please check your connection and try again, or email hello@lysrosebabyspa.com.');
    } finally {
      window.clearTimeout(timer); submitting = false; form.removeAttribute('aria-busy');
      if (button.isConnected) { button.disabled = false; button.textContent = originalText; status.textContent = ''; }
    }
  });
}

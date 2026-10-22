const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('#site-menu');
const toggle = document.querySelector('#menu-toggle');
if (menu && toggle) {
  toggle.addEventListener('click', () => { menu.showModal(); toggle.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); });
  const close = () => menu.close();
  menu.querySelector('.menu-close').addEventListener('click', close);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  menu.addEventListener('close', () => { toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); toggle.focus({preventScroll:true}); });
}
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), {threshold:0.06});
  document.querySelectorAll('[data-reveal]').forEach(section => observer.observe(section));
}
const parallax = document.querySelector('[data-parallax]');
if (parallax) {
  let pending = false;
  const draw = () => {
    parallax.style.transform = reducedMotion.matches ? 'none' : `translate3d(0, ${Math.min(window.scrollY,900)*0.12}px, 0)`;
    pending = false;
  };
  window.addEventListener('scroll', () => { if (!pending) { pending=true; requestAnimationFrame(draw); } }, {passive:true});
  reducedMotion.addEventListener('change', draw);
  draw();
}
const form = document.querySelector('#waitlist-form');
if (form) form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('[type=submit]');
  const error = document.querySelector('#form-error');
  const originalText = button.textContent;
  button.disabled = true; button.textContent = 'SENDING…'; error.hidden = true;
  const fields = new FormData(form);
  const payload = Object.fromEntries(fields);
  payload.interests = fields.getAll('interests');
  try {
    const response = await fetch(form.action, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Please try again.');
    const success = document.createElement('p');
    success.className = 'form-success'; success.tabIndex=-1; success.setAttribute('role','status');
    success.textContent = "Thank you, you're on the list. We'll email you as soon as sessions open.";
    form.replaceChildren(success); success.focus();
  } catch {
    error.textContent = 'Your signup could not be sent. Please try again, or email hello@lysrosebabyspa.com.';
    error.hidden = false; error.tabIndex = -1; error.focus();
    button.disabled=false; button.textContent=originalText;
  }
});

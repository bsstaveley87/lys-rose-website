// Preview-only booking rules. Seat count stays in this module and is never written into the page.
export const SEATS_PER_SESSION = 12;
// Christy's rule: babies are at least 4 weeks old. The form also requires three confirmations before booking.
export const MIN_AGE_WEEKS = 4;
/** Pilot session price in cents. This is the only session price to edit. */
export const SESSION_PRICE_CENTS = 28500;

export function sessionPriceLabel() {
  return `$${SESSION_PRICE_CENTS / 100}`;
}

export function sessionPriceLine() {
  return `${sessionPriceLabel()} per parent & baby`;
}

export function sessionPriceOffer() {
  return (SESSION_PRICE_CENTS / 100).toFixed(2);
}
export const FACE_CREAM_CENTS = {signature: 0, gentle: 500, premium: 1000};
export const BATH_BAG_CENTS = 1800;
export const SECOND_ADULT_CENTS = 2500;
/** Null hides the robe row. Set this to cents, and the server price, to offer it again. */
export const ROBE_CENTS = null;
export const ROBE_LEAD_DAYS = 14;
export const BOOKING_LEAD_HOURS = 48;
const ROBE_TIME_ZONE = 'America/New_York';
/**
 * The only session date and time. Set this when the session is confirmed;
 * null keeps the date and time unannounced and turns both cutoffs off.
 * Times are America/New_York, 24-hour "HH:MM".
 * Example: {date:'2026-12-06', start:'10:30', end:'12:30'}
 */
export const SESSION = null;
/** Hosted checkout stays off until a session date is set and the worker has its secrets. */
export const CHECKOUT_CONFIGURED = false;
export const CHECKOUT_URL = 'https://forms.lysrosebabyspa.com/api/checkout';

const DAY_MS = 24 * 60 * 60 * 1000;

export function sessionStatus(reserved) {
  return Number(reserved) < SEATS_PER_SESSION ? 'Available' : 'Fully booked';
}

export function previewTotal(addonSelected, faceCream = 'signature', bathBag = false, secondAdult = false) {
  const extra = (FACE_CREAM_CENTS[faceCream] || 0) + (bathBag ? BATH_BAG_CENTS : 0) + (secondAdult ? SECOND_ADULT_CENTS : 0);
  const cents = SESSION_PRICE_CENTS + extra;
  return {
    cents,
    label: `$${cents / 100}`,
    addonPending: Boolean(addonSelected),
  };
}

function shiftDays(iso, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const shifted = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${month}-${day}`;
}

function formatMonthDay(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const stamp = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  const month = new Intl.DateTimeFormat('en-US', {month: 'long', timeZone: 'UTC'}).format(stamp);
  return `${month} ${stamp.getUTCDate()}`;
}

function zoneOffsetMs(instant, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant)).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  let hour = Number(parts.hour);
  let day = Number(parts.day);
  if (hour === 24) {
    hour = 0;
    day += 1;
  }
  const wall = Date.UTC(Number(parts.year), Number(parts.month) - 1, day, hour, Number(parts.minute), Number(parts.second));
  return wall - instant;
}

function wallTimeToUtc(year, monthIndex, day, hour, minute, second, ms, timeZone) {
  const desired = Date.UTC(year, monthIndex, day, hour, minute, second, ms);
  let utc = desired;
  for (let pass = 0; pass < 3; pass += 1) utc = desired - zoneOffsetMs(utc, timeZone);
  return utc;
}

export function robeCutoffIso(sessionIso) {
  return shiftDays(sessionIso, -ROBE_LEAD_DAYS);
}

/** First instant the robe option is closed: midnight Eastern on the day after the 14-day cutoff. */
export function robeClosesAt(sessionIso) {
  const cutoff = robeCutoffIso(sessionIso);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cutoff);
  if (!match) return NaN;
  const next = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1));
  return wallTimeToUtc(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate(), 0, 0, 0, 0, ROBE_TIME_ZONE);
}

export function robeIsClosed(sessionIso, now = new Date()) {
  return now.getTime() >= robeClosesAt(sessionIso);
}

export function robeNote(sessionIso) {
  if (!sessionIso) return 'Personalized robes are embroidered to order, so this option closes 14 days before your session.';
  const cutoff = robeCutoffIso(sessionIso);
  if (!cutoff) return 'Personalized robes are embroidered to order, so this option closes 14 days before your session.';
  return `Personalized robes are embroidered to order, so this option closes 14 days before your session (${formatMonthDay(cutoff)} for ${formatMonthDay(sessionIso)}).`;
}

function sessionClockMs(session, clock) {
  if (!session?.date || !clock) return NaN;
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(session.date);
  const time = /^(\d{2}):(\d{2})$/.exec(clock);
  if (!date || !time) return NaN;
  return wallTimeToUtc(Number(date[1]), Number(date[2]) - 1, Number(date[3]), Number(time[1]), Number(time[2]), 0, 0, ROBE_TIME_ZONE);
}

export function sessionStartMs(session) {
  return sessionClockMs(session, session?.start);
}

export function bookingClosesAt(session, leadHours = BOOKING_LEAD_HOURS) {
  const start = sessionStartMs(session);
  if (Number.isNaN(start)) return NaN;
  return start - leadHours * 60 * 60 * 1000;
}

export function bookingIsClosed(session, now = new Date(), leadHours = BOOKING_LEAD_HOURS) {
  const closes = bookingClosesAt(session, leadHours);
  if (Number.isNaN(closes)) return false;
  return now.getTime() >= closes;
}

function formatClock(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || '');
  if (!match) return '';
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  return minute ? `${hour}:${String(minute).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

export function sessionDateLabel(session) {
  if (!session?.date) return 'Date to be announced';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(session.date);
  if (!match) return 'Date to be announced';
  const stamp = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric', timeZone:'UTC'}).format(stamp);
}

export function sessionTimeLabel(session) {
  if (!session?.start || !session?.end) return 'Time to be announced';
  const start = formatClock(session.start);
  const end = formatClock(session.end);
  if (!start || !end) return 'Time to be announced';
  return `${start} to ${end}`;
}

function applySessionPrice(documentRef) {
  const line = documentRef.querySelector('[data-session-price]');
  if (line) line.textContent = sessionPriceLine();
  const total = documentRef.querySelector('[data-session-price-total]');
  if (total) total.textContent = sessionPriceLabel();
  for (const script of documentRef.querySelectorAll('script[type="application/ld+json"]')) {
    if (script.textContent.includes('SESSION_PRICE')) script.textContent = script.textContent.replaceAll('SESSION_PRICE', sessionPriceOffer());
  }
}

function applySession(documentRef, now = new Date()) {
  applySessionPrice(documentRef);
  const dateEl = documentRef.querySelector('#session-date');
  const timeEl = documentRef.querySelector('#session-time');
  if (dateEl) dateEl.textContent = sessionDateLabel(SESSION);
  if (timeEl) timeEl.textContent = sessionTimeLabel(SESSION);
  const card = documentRef.querySelector('#session-card');
  if (card) {
    if (SESSION?.date) card.dataset.sessionDate = SESSION.date;
    else delete card.dataset.sessionDate;
  }
  const script = documentRef.querySelector('script[type="application/ld+json"]');
  if (script) {
    try {
      const data = JSON.parse(script.textContent);
      const start = sessionStartMs(SESSION);
      const end = sessionClockMs(SESSION, SESSION?.end);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        data.startDate = new Date(start).toISOString();
        data.endDate = new Date(end).toISOString();
      } else {
        delete data.startDate;
        delete data.endDate;
      }
      script.textContent = JSON.stringify(data);
    } catch { /* leave the static preview schema */ }
  }
  const closed = bookingIsClosed(SESSION, now);
  const notice = documentRef.querySelector('#booking-window');
  if (notice) notice.hidden = !closed;
  const form = documentRef.querySelector('#booking-form');
  if (form) form.dataset.bookingClosed = closed ? 'true' : 'false';
}

function placeRobeAddon(list, item) {
  const bathBag = list.querySelector('#bath-bag-addon');
  if (bathBag) list.insertBefore(item, bathBag);
  else list.appendChild(item);
}

/** Coming soon while ROBE_CENTS is null. A set price replaces that row with the selectable robe. */
export function mountRobeAddon(documentRef, cents = ROBE_CENTS) {
  const list = documentRef.querySelector('#book-addons .addon-preview');
  if (!list) return;
  const existing = list.querySelector('[data-robe-addon]');
  if (cents == null) return;
  const item = documentRef.createElement('li');
  item.id = 'robe-addon';
  item.dataset.robeAddon = '';
  item.innerHTML = `<label><input type="checkbox" id="robe-option" name="robe" value="yes" form="booking-form"/><span class="addon-copy"><span class="addon-heading"><span class="enhancement-title">Embroidered Keepsake Robe</span><span class="addon-price">+$${cents / 100}</span></span><span class="enhancement-note">A personalized embroidered robe for your baby.</span><span class="enhancement-note robe-note" id="robe-note"></span><span class="enhancement-note">Taxes may apply to enhancements.</span></span></label>`;
  if (existing) existing.remove();
  placeRobeAddon(list, item);
}

export function applyRobeCutoff(documentRef, now = new Date()) {
  const robe = documentRef.querySelector('[data-robe-addon]');
  if (!robe) return;
  const sessionIso = SESSION?.date || '';
  const note = robe.querySelector('#robe-note');
  if (note) note.textContent = robeNote(sessionIso);
  if (!sessionIso || !robeIsClosed(sessionIso, now)) {
    robe.classList.remove('is-closed');
    return;
  }
  robe.classList.add('is-closed');
  const input = robe.querySelector('input');
  if (input) {
    input.disabled = true;
    input.checked = false;
  }
  const available = robe.querySelector('.available-to-add');
  if (available) available.hidden = true;
}

function utcDay(year, monthIndex, day) {
  return Date.UTC(year, monthIndex, day);
}

function shiftMonths(utcMs, months) {
  const date = new Date(utcMs);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.getTime();
}

export function babyAgeMessage(iso, today = new Date()) {
  if (!iso) return "Please enter your baby's date of birth.";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return 'Please enter a valid date of birth.';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return 'Please enter a valid date of birth.';
  }
  const dob = utcDay(year, month - 1, day);
  const now = utcDay(today.getFullYear(), today.getMonth(), today.getDate());
  if (dob > now) return 'Please enter a date of birth in the past.';
  const youngest = now - MIN_AGE_WEEKS * 7 * DAY_MS;
  const oldest = shiftMonths(now, -12);
  if (dob > youngest) return 'Please enter a date of birth at least 4 weeks ago.';
  if (dob <= oldest) return 'Sessions are for babies under 12 months.';
  return '';
}

const previewReserved = [0, SEATS_PER_SESSION];

function showAge(input) {
  const message = babyAgeMessage(input.value);
  const error = document.getElementById('baby-dob-error');
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
}

function missingConfirmations(form) {
  return [...form.querySelectorAll('[name=confirmReady]')].filter(box => !box.checked);
}

function showConfirmations(form) {
  const missing = missingConfirmations(form);
  const error = form.querySelector('#booking-confirm-error');
  const message = missing.length ? 'Please confirm each item before reserving.' : '';
  for (const box of form.querySelectorAll('[name=confirmReady]')) {
    box.setAttribute('aria-invalid', message && !box.checked ? 'true' : 'false');
  }
  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
  return missing;
}

function syncBath(form) {
  const byob = Boolean(form.querySelector('[name=bath][value=byob]')?.checked);
  const details = form.querySelector('#byob-details');
  if (details) details.hidden = !byob;
  const petals = form.querySelector('[name=rosePetals]');
  if (petals && !byob) petals.checked = false;
  const error = form.querySelector('#bath-error');
  const chosen = Boolean(form.querySelector('[name=bath]:checked'));
  if (error && chosen) {
    error.textContent = '';
    error.hidden = true;
  }
}

function showBath(form) {
  const chosen = Boolean(form.querySelector('[name=bath]:checked'));
  const error = form.querySelector('#bath-error');
  if (!error) return chosen;
  error.textContent = chosen ? '' : 'Please choose a bath.';
  error.hidden = chosen;
  return chosen;
}

function syncAllergies(form) {
  const share = form.querySelector('[name=allergies][value=share]');
  const details = form.querySelector('#allergy-details-field');
  const notes = form.querySelector('#allergy-details');
  const open = Boolean(share?.checked);
  if (details) details.hidden = !open;
  if (notes) {
    notes.required = open;
    if (!open) notes.value = '';
  }
}

function checkoutReady() {
  return Boolean(SESSION?.date) && CHECKOUT_CONFIGURED && !bookingIsClosed(SESSION);
}

function applyPayButton(documentRef) {
  const button = documentRef.querySelector('.booking-pay');
  if (button) button.disabled = !checkoutReady();
}

function bookingPayload(form) {
  const page = form.ownerDocument || form;
  return {
    parentName: form.querySelector('[name=parentName]')?.value || '',
    email: form.querySelector('[name=email]')?.value || '',
    phone: form.querySelector('[name=phone]')?.value || '',
    babyName: form.querySelector('[name=babyName]')?.value || '',
    babyDob: form.querySelector('[name=babyDob]')?.value || '',
    bath: form.querySelector('[name=bath]:checked')?.value || '',
    rosePetals: Boolean(form.querySelector('[name=rosePetals]')?.checked),
    creme: page.querySelector('[name=faceCream]:checked')?.value || '',
    confirmReady: [...form.querySelectorAll('[name=confirmReady]:checked')].map(box => box.value),
    robe: Boolean(page.querySelector('[name=robe]')?.checked),
    robeName: page.querySelector('[name=robeName]')?.value || '',
    bathBag: Boolean(page.querySelector('[name=bathBag]')?.checked),
    secondAdult: Boolean(page.querySelector('[name=secondAdult]')?.checked),
    allergies: form.querySelector('[name=allergies]:checked')?.value || '',
    allergyDetails: form.querySelector('[name=allergyDetails]')?.value || '',
    waiver: Boolean(form.querySelector('[name=waiver]')?.checked),
    photoRelease: Boolean(form.querySelector('[name=photoRelease]')?.checked),
  };
}

async function startCheckout(form) {
  const button = form.querySelector('.booking-pay');
  const error = form.querySelector('#checkout-error');
  const show = message => {
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
  };
  show('');
  if (button) button.disabled = true;
  try {
    const response = await fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(bookingPayload(form)),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      show(data.error || 'Checkout is not available yet.');
      if (button) button.disabled = !checkoutReady();
      return;
    }
    window.location.assign(data.url);
  } catch {
    show('Checkout is not available yet.');
    if (button) button.disabled = !checkoutReady();
  }
}

function syncTotal(documentRef = document) {
  const choice = documentRef.querySelector('[name=faceCream]:checked')?.value || 'signature';
  const bathBag = Boolean(documentRef.querySelector('[name=bathBag]')?.checked);
  const secondAdult = Boolean(documentRef.querySelector('[name=secondAdult]')?.checked);
  const total = previewTotal(false, choice, bathBag, secondAdult);
  const amount = documentRef.getElementById('booking-total');
  if (amount) amount.textContent = total.label;
  const line = documentRef.getElementById('face-cream-charge');
  const extra = FACE_CREAM_CENTS[choice] || 0;
  if (!line) return;
  line.hidden = extra === 0;
  const name = documentRef.getElementById('face-cream-charge-label');
  const price = documentRef.getElementById('face-cream-charge-amount');
  const option = documentRef.querySelector(`[name=faceCream][value="${choice}"]`);
  if (name) name.textContent = option?.closest('label')?.querySelector('span')?.textContent || '';
  if (price) price.textContent = extra ? `+$${extra / 100}` : '';
}

export function initBooking(documentRef = document) {
  const form = documentRef.querySelector('#booking-form');
  if (!form) return;
  documentRef.querySelectorAll('[data-booking-card]').forEach((card, index) => {
    const status = sessionStatus(previewReserved[index] ?? 0);
    const node = card.querySelector('.date-status');
    if (node) node.textContent = status;
    card.classList.toggle('is-booked', status === 'Fully booked');
  });
  const dob = form.querySelector('#baby-dob');
  if (dob) {
    const today = new Date();
    const oldest = new Date(shiftMonths(utcDay(today.getFullYear(), today.getMonth(), today.getDate()), -12) + DAY_MS);
    const youngest = new Date(utcDay(today.getFullYear(), today.getMonth(), today.getDate()) - MIN_AGE_WEEKS * 7 * DAY_MS);
    const iso = date => date.toISOString().slice(0, 10);
    dob.min = iso(oldest);
    dob.max = iso(youngest);
    dob.addEventListener('change', () => showAge(dob));
    dob.addEventListener('blur', () => showAge(dob));
  }
  documentRef.addEventListener('change', event => {
    if (event.target?.name === 'faceCream' || event.target?.name === 'bathBag' || event.target?.name === 'secondAdult') syncTotal(documentRef);
    if (event.target?.name === 'bath') syncBath(form);
  });
  form.addEventListener('change', event => {
    if (event.target?.name === 'allergies') syncAllergies(form);
    if (event.target?.name === 'confirmReady' && missingConfirmations(form).length === 0) showConfirmations(form);
  });
  form.addEventListener('focusout', event => {
    if (event.target?.name === 'confirmReady' && !event.target.checked) showConfirmations(form);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (bookingIsClosed(SESSION)) {
      const notice = documentRef.querySelector('#booking-window');
      if (notice) {
        notice.hidden = false;
        notice.focus();
      }
      return;
    }
    const ageMessage = dob ? babyAgeMessage(dob.value) : '';
    if (dob) showAge(dob);
    const bathOk = showBath(form);
    const missing = showConfirmations(form);
    if (ageMessage || !bathOk || missing.length) {
      if (ageMessage && dob) dob.focus();
      else if (!bathOk) form.querySelector('[name=bath]')?.focus();
      else missing[0]?.focus();
      return;
    }
    if (checkoutReady()) startCheckout(form);
  });
  form.querySelector('.booking-pay')?.addEventListener('click', () => {
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
  });
  syncAllergies(form);
  syncBath(form);
  syncTotal(documentRef);
  applySession(documentRef);
  mountRobeAddon(documentRef);
  applyRobeCutoff(documentRef);
  applyPayButton(documentRef);
}

if (typeof document !== 'undefined') initBooking(document);

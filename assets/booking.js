// Preview-only booking rules. Seat count stays in this module and is never written into the page.
export const SEATS_PER_SESSION = 12;
// Christy's rule: babies are at least 4 weeks old. The form also requires three confirmations before booking.
export const MIN_AGE_WEEKS = 4;
export const SESSION_PRICE_CENTS = 28000;
export const FACE_CREAM_CENTS = {signature: 0, gentle: 500, premium: 1000};
export const ROBE_LEAD_DAYS = 14;
const ROBE_TIME_ZONE = 'America/New_York';

const DAY_MS = 24 * 60 * 60 * 1000;

export function sessionStatus(reserved) {
  return Number(reserved) < SEATS_PER_SESSION ? 'Available' : 'Fully booked';
}

export function previewTotal(addonSelected, faceCream = 'signature') {
  const extra = FACE_CREAM_CENTS[faceCream] || 0;
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
  const cutoff = robeCutoffIso(sessionIso);
  return `Personalized robes are embroidered to order, so this option closes 14 days before your session (${formatMonthDay(cutoff)} for ${formatMonthDay(sessionIso)}).`;
}

function applyRobeCutoff(documentRef, now = new Date()) {
  const sessionIso = documentRef.querySelector('#session-card')?.dataset.sessionDate;
  const robe = documentRef.querySelector('[data-robe-addon]');
  if (!sessionIso || !robe) return;
  const note = robe.querySelector('#robe-note');
  if (note) note.textContent = robeNote(sessionIso);
  if (!robeIsClosed(sessionIso, now)) return;
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

function syncTotal(documentRef = document) {
  const choice = documentRef.querySelector('[name=faceCream]:checked')?.value || 'signature';
  const total = previewTotal(false, choice);
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
    if (event.target?.name === 'faceCream') syncTotal(documentRef);
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
    const ageMessage = dob ? babyAgeMessage(dob.value) : '';
    if (dob) showAge(dob);
    const missing = showConfirmations(form);
    if (ageMessage || missing.length) {
      (ageMessage && dob ? dob : missing[0])?.focus();
      return;
    }
  });
  syncAllergies(form);
  syncTotal(documentRef);
  applyRobeCutoff(documentRef);
}

if (typeof document !== 'undefined') initBooking(document);

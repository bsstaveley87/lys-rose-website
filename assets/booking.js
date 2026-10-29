// Preview-only booking rules. Seat count stays in this module and is never written into the page.
export const SEATS_PER_SESSION = 12;
// TODO pending Christy: confirm the minimum age before any real booking opens.
export const MIN_AGE_WEEKS = 8;
export const SESSION_PRICE_CENTS = 28000;

const DAY_MS = 24 * 60 * 60 * 1000;

export function sessionStatus(reserved) {
  return Number(reserved) < SEATS_PER_SESSION ? 'Available' : 'Fully booked';
}

export function previewTotal(addonSelected) {
  return {
    cents: SESSION_PRICE_CENTS,
    label: `$${SESSION_PRICE_CENTS / 100}`,
    addonPending: Boolean(addonSelected),
  };
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
  if (dob > youngest) return 'Please enter a date of birth at least 8 weeks ago. This minimum is a placeholder pending confirmation.';
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

function syncTotal(form) {
  const total = previewTotal(form.querySelector('#robe-set')?.checked);
  const amount = document.getElementById('booking-total');
  const note = document.getElementById('addon-note');
  if (amount) amount.textContent = total.label;
  if (note) note.hidden = !total.addonPending;
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
  form.addEventListener('change', event => {
    if (event.target?.name === 'allergies') syncAllergies(form);
    if (event.target?.id === 'robe-set') syncTotal(form);
  });
  form.addEventListener('submit', event => event.preventDefault());
  syncAllergies(form);
  syncTotal(form);
}

if (typeof document !== 'undefined') initBooking(document);

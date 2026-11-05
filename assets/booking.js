// Preview-only booking rules. Seat count stays in this module and is never written into the page.
export const SEATS_PER_SESSION = 12;
/** Youngest age, in days, on the session date. 28 days is 4 weeks. */
export const MIN_BABY_AGE_DAYS = 28;
/**
 * Oldest age, in calendar months, on the session date.
 * A baby who turns this many months on the session date is allowed.
 * Null means no upper limit.
 */
export const MAX_BABY_AGE_MONTHS = 12;
export const AGE_TOO_YOUNG_MESSAGE = 'Your baby needs to be at least 4 weeks old on the day of the session.';
export const AGE_TOO_OLD_MESSAGE = 'Our sessions are designed for babies from 4 weeks to 12 months old.';
/** Pilot session price in cents. This is the only session price to edit. */
export const SESSION_PRICE_CENTS = 28500;
/** Nonrefundable deposit in cents. The refund line and deposit checkbox use this with the session price. */
export const DEPOSIT_CENTS = 10000;
/** Full birth dates are kept this many years after the family's last booking, then only age in months remains. */
export const BIRTH_DATE_RETENTION_YEARS = 3;
/** DRAFT pending Christy. {deposit}, {price}, {balance} and {half} are filled from the price config. */
export const REFUND_SUMMARY = "{deposit} of your {price} payment is a nonrefundable deposit that holds your spot. If you cancel 7 or more days before your session, we refund the {balance} balance. If you cancel 48 hours or more before, we refund {half}. Within 48 hours, there's no refund. Add-ons follow the same timing, except personalized robes once they're sent for embroidery. If your baby is unwell, we'll move you to a new date within 60 days. If we cancel, you get a full refund.";
/** DRAFT pending Christy. {deposit} is filled from DEPOSIT_CENTS. */
export const DEPOSIT_ACK = "I understand {deposit} of my payment is a nonrefundable deposit that holds my spot. It isn't refunded, but it can go toward a new session for my family booked within 60 days, as long as my baby still meets the age rule (at least 4 weeks and no older than 12 months) on the new date.";
/** DRAFT pending Christy. */
export const SICK_SYMPTOMS_ACK = 'In the 24 hours before the session, my baby has had no fever, vomiting or diarrhea, and has no green nasal mucus.';
/** DRAFT pending Christy. */
export const SICK_ILLNESS_ACK = 'My baby has no other signs of illness (such as a rash or cough) and no breaks in the skin.';
/** DRAFT pending Christy. */
export const SICK_CHECKIN_ACK = "I understand that if my baby seems unwell at check-in, the instructor may ask us not to join. In that case I'll be offered a free reschedule within 60 days, or store credit if no new date works, not a cash refund.";
/** DRAFT pending Christy. */
export const SICK_CONTACT_ACK = "I'll contact Lys Rose before the session if my baby becomes unwell.";
export const BOOKING_CONFIRMATIONS = ['age', 'pediatrician', 'price', 'symptoms', 'illness', 'checkin', 'contact', 'deposit'];
/** DRAFT pending CFO. Section 2 of the waiver e-signature draft, without the attorney note. */
export const WAIVER_HEADING = 'Assumption of risk and release (DRAFT).';
export const WAIVER_RELEASE_TEXT = `${WAIVER_HEADING} I am the parent or legal guardian of the baby named in this booking. I understand that a Lys Rose session is an educational, parent-led group class. I provide all hands-on care for my baby, and the instructor guides. Lys Rose doesn't offer facials, medical treatments, physical therapy or massage therapy. I understand the session has inherent risks, including: handling a wet, slippery baby in and around warm water; water that may be too warm or too cool; slips and falls on wet floors; a skin reaction or allergy to the products used (including the milk soak, oils, creams and floating rose petals); a baby mouthing or swallowing a petal or other small item; contact with shared, sanitized tools; and exposure to common illnesses in a group setting. I agree to keep my baby under my direct supervision and within my reach at all times. I voluntarily accept these risks for myself and my baby. To the fullest extent the law allows, I release Lys Rose LLC (doing business as Lys Rose Baby Spa), its owner, instructors and contractors from claims for injury or loss arising from these inherent risks.`;
/** Placeholder only. Do not replace this with drafted statutory language. */
export const FLORIDA_STATUTORY_NOTICE = '[Florida statutory notice: attorney to insert]';
/** DRAFT pending CFO. Lead-in from the waiver e-signature draft. */
export const SIGNATURE_HEADING = 'Sign your waiver.';
export const SIGNATURE_LEAD = `${SIGNATURE_HEADING} Please read the waiver and booking terms above. By typing your full name and selecting "Sign and continue," you are signing electronically. Your typed name is your legal signature, just as if you'd signed on paper, and it applies to the waiver and the booking terms shown on this page. You confirm you're the baby's parent or legal guardian and at least 18. We'll email you a copy of what you signed.`;
/** DRAFT pending CFO. */
export const ESIGN_CONSENT = 'I agree to sign and receive these documents electronically. I can ask for a paper copy at any time by emailing hello@lysrosebabyspa.com.';
export const AGE_ACK = 'My baby is at least 4 weeks old, has no breaks in the skin, the umbilical cord stump has fallen off and healed, and any circumcision site is fully healed.';
export const PEDIATRICIAN_ACK = "I've talked with my pediatrician about the products and activities used in the session, and I know I can skip any part at any time.";
export const SKIP_ACK = "I understand there's no refund or discount for skipping any part of the session.";
/** The agreement version stored with each signature. Signed copies are not on the birth-date deletion schedule. */
export const BOOKING_TERMS_VERSION = 'booking-waiver-esignature-draft-2026-11-05';
export const WAIVER_RETENTION = 'attorney to set';
const DRAFT_ACKS = {
  symptoms: SICK_SYMPTOMS_ACK,
  illness: SICK_ILLNESS_ACK,
  checkin: SICK_CHECKIN_ACK,
  contact: SICK_CONTACT_ACK,
};

export function sessionPriceLabel() {
  return `$${SESSION_PRICE_CENTS / 100}`;
}

export function sessionPriceLine() {
  return `${sessionPriceLabel()} per parent & baby`;
}

export function sessionPriceOffer() {
  return (SESSION_PRICE_CENTS / 100).toFixed(2);
}

export function formatCents(cents) {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const body = remainder === 0 ? String(dollars) : `${dollars}.${String(remainder).padStart(2, '0')}`;
  return `${negative ? '-' : ''}$${body}`;
}

export function refundBalanceCents(priceCents = SESSION_PRICE_CENTS, depositCents = DEPOSIT_CENTS) {
  return priceCents - depositCents;
}

export function refundHalfBalanceCents(priceCents = SESSION_PRICE_CENTS, depositCents = DEPOSIT_CENTS) {
  return Math.round(refundBalanceCents(priceCents, depositCents) / 2);
}

export function fillRefundSummary(priceCents = SESSION_PRICE_CENTS, depositCents = DEPOSIT_CENTS) {
  return REFUND_SUMMARY
    .replaceAll('{deposit}', formatCents(depositCents))
    .replaceAll('{price}', formatCents(priceCents))
    .replaceAll('{balance}', formatCents(refundBalanceCents(priceCents, depositCents)))
    .replaceAll('{half}', formatCents(refundHalfBalanceCents(priceCents, depositCents)));
}

export function fillDepositAck(depositCents = DEPOSIT_CENTS) {
  return DEPOSIT_ACK.replaceAll('{deposit}', formatCents(depositCents));
}

/** Exact text shown for the waiver, the terms, and every box label. The stored hash is of this string. */
export function signedDocumentText() {
  return [
    'Waiver',
    WAIVER_RELEASE_TEXT,
    FLORIDA_STATUTORY_NOTICE,
    SIGNATURE_LEAD,
    ESIGN_CONSENT,
    AGE_ACK,
    PEDIATRICIAN_ACK,
    SKIP_ACK,
    SICK_SYMPTOMS_ACK,
    SICK_ILLNESS_ACK,
    SICK_CHECKIN_ACK,
    SICK_CONTACT_ACK,
    fillDepositAck(),
    fillRefundSummary(),
  ].filter(part => part !== '').join('\n');
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

function addCalendarMonths(utcMs, months) {
  const date = new Date(utcMs);
  const day = date.getUTCDate();
  const stamp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(stamp.getUTCFullYear(), stamp.getUTCMonth() + 1, 0)).getUTCDate();
  stamp.setUTCDate(Math.min(day, last));
  return stamp.getTime();
}

function parseIsoDay(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return utcDay(year, month - 1, day);
}

function dayStamp(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return utcDay(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'string') return parseIsoDay(value);
  return null;
}

/** Age is measured on the session date. A Date argument is that calendar day. */
export function babyAgeMessage(iso, sessionDate = new Date()) {
  if (!iso) return "Please enter your baby's date of birth.";
  const dob = parseIsoDay(iso);
  if (dob == null) return 'Please enter a valid date of birth.';
  const sessionDay = dayStamp(sessionDate);
  if (sessionDay == null) return 'Please enter a valid date of birth.';
  const ageDays = Math.round((sessionDay - dob) / DAY_MS);
  if (MIN_BABY_AGE_DAYS != null && ageDays < MIN_BABY_AGE_DAYS) return AGE_TOO_YOUNG_MESSAGE;
  if (MAX_BABY_AGE_MONTHS != null && sessionDay > addCalendarMonths(dob, MAX_BABY_AGE_MONTHS)) return AGE_TOO_OLD_MESSAGE;
  return '';
}

/** Completed calendar months on the session date. The birth date itself is not kept past the retention window. */
export function ageMonthsAtSession(iso, sessionDate) {
  const dob = parseIsoDay(iso);
  const sessionDay = dayStamp(sessionDate);
  if (dob == null || sessionDay == null) return null;
  const birth = new Date(dob);
  const session = new Date(sessionDay);
  let months = (session.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (session.getUTCMonth() - birth.getUTCMonth());
  if (session.getUTCDate() < birth.getUTCDate()) months -= 1;
  return months;
}

export function applyDraftCopy(documentRef) {
  const amounts = {
    deposit: formatCents(DEPOSIT_CENTS),
    price: formatCents(SESSION_PRICE_CENTS),
    balance: formatCents(refundBalanceCents()),
    half: formatCents(refundHalfBalanceCents()),
  };
  for (const node of documentRef.querySelectorAll('[data-money]')) node.textContent = amounts[node.getAttribute('data-money')] || '';
  for (const node of documentRef.querySelectorAll('[data-refund-summary]')) node.textContent = fillRefundSummary();
  for (const node of documentRef.querySelectorAll('[data-deposit-ack]')) node.textContent = fillDepositAck();
  for (const node of documentRef.querySelectorAll('[data-ack]')) node.textContent = DRAFT_ACKS[node.getAttribute('data-ack')] || '';
  for (const node of documentRef.querySelectorAll('[data-signature-heading]')) node.textContent = SIGNATURE_HEADING;
  for (const node of documentRef.querySelectorAll('[data-signature-rest]')) node.textContent = SIGNATURE_LEAD.slice(SIGNATURE_HEADING.length).trim();
  for (const node of documentRef.querySelectorAll('[data-waiver-heading]')) node.textContent = WAIVER_HEADING;
  for (const node of documentRef.querySelectorAll('[data-waiver-body]')) node.textContent = WAIVER_RELEASE_TEXT.slice(WAIVER_HEADING.length).trim();
  for (const node of documentRef.querySelectorAll('[data-florida-notice]')) node.textContent = FLORIDA_STATUTORY_NOTICE;
}

const previewReserved = [0, SEATS_PER_SESSION];

function ageReference() {
  return SESSION?.date || new Date();
}

function showAge(input) {
  const message = babyAgeMessage(input.value, ageReference());
  const error = (input.ownerDocument || document).getElementById('baby-dob-error');
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
  const depositMissing = missing.some(box => box.value === 'deposit');
  const depositError = form.querySelector('#deposit-error');
  if (depositError) {
    depositError.textContent = depositMissing ? 'Please confirm the deposit before reserving.' : '';
    depositError.hidden = !depositMissing;
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

function signatureReady(form) {
  const signature = form.querySelector('[name=signatureName]');
  if (!signature) return true;
  const value = signature.value.trim();
  return value.length > 0 && /\p{L}/u.test(value);
}

function payReady(form) {
  const dob = form.querySelector('#baby-dob');
  const dobOk = Boolean(dob?.value) && !babyAgeMessage(dob.value, ageReference());
  const boxes = [...form.querySelectorAll('input[type=checkbox][required]')];
  return dobOk && boxes.length > 0 && boxes.every(box => box.checked) && signatureReady(form);
}

function showSignature(form) {
  const signature = form.querySelector('[name=signatureName]');
  const error = form.querySelector('#signature-name-error');
  if (!signature) return true;
  const ready = signatureReady(form);
  const message = signature.value.trim() && !ready ? 'Please type your full name.' : '';
  signature.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
  return ready;
}

function fillSignatureDate(form) {
  const input = form.querySelector('#signature-date');
  if (!input || input.value) return;
  input.value = new Intl.DateTimeFormat('en-US', {month: 'long', day: 'numeric', year: 'numeric'}).format(new Date());
}

function applyPayButton(documentRef) {
  const root = documentRef.querySelector ? documentRef : documentRef.ownerDocument;
  const form = root?.querySelector?.('#booking-form');
  const button = form?.querySelector('.booking-pay');
  if (!button || !form) return;
  const ready = payReady(form);
  button.disabled = !ready;
  button.setAttribute('aria-disabled', ready ? 'false' : 'true');
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
    signatureName: form.querySelector('[name=signatureName]')?.value || '',
    esignConsent: Boolean(form.querySelector('[name=esignConsent]')?.checked),
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
      const fields = data.fields || {};
      const dob = form.querySelector('#baby-dob');
      if (dob && fields.babyDob) showAge(dob);
      if (fields.confirmReady) showConfirmations(form);
      if (fields.signatureName) showSignature(form);
      show(fields.babyDob || fields.signatureName || fields.confirmReady || data.error || 'Checkout is not available yet.');
      applyPayButton(form.ownerDocument || form);
      return;
    }
    window.location.assign(data.url);
  } catch {
    show('Checkout is not available yet.');
    applyPayButton(form.ownerDocument || form);
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
    const sessionDay = dayStamp(ageReference());
    if (sessionDay != null && MIN_BABY_AGE_DAYS != null) dob.max = new Date(sessionDay - MIN_BABY_AGE_DAYS * DAY_MS).toISOString().slice(0, 10);
    if (sessionDay != null && MAX_BABY_AGE_MONTHS != null) dob.min = new Date(addCalendarMonths(sessionDay, -MAX_BABY_AGE_MONTHS)).toISOString().slice(0, 10);
    dob.addEventListener('change', () => {
      showAge(dob);
      applyPayButton(documentRef);
    });
    dob.addEventListener('blur', () => showAge(dob));
  }
  documentRef.addEventListener('change', event => {
    if (event.target?.name === 'faceCream' || event.target?.name === 'bathBag' || event.target?.name === 'secondAdult') syncTotal(documentRef);
    if (event.target?.name === 'bath') syncBath(form);
  });
  form.addEventListener('change', event => {
    if (event.target?.name === 'allergies') syncAllergies(form);
    if (event.target?.name === 'confirmReady' || event.target?.name === 'waiver') {
      if (missingConfirmations(form).length === 0) showConfirmations(form);
      applyPayButton(documentRef);
    }
  });
  form.addEventListener('input', event => {
    if (event.target?.name === 'signatureName' || event.target?.name === 'parentName') {
      if (event.target?.name === 'signatureName') showSignature(form);
      applyPayButton(documentRef);
    }
  });
  form.addEventListener('focusout', event => {
    if (event.target?.name === 'confirmReady' && !event.target.checked) showConfirmations(form);
    if (event.target?.name === 'signatureName') showSignature(form);
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
    const ageMessage = dob ? babyAgeMessage(dob.value, ageReference()) : '';
    if (dob) showAge(dob);
    const bathOk = showBath(form);
    const missing = showConfirmations(form);
    const signed = showSignature(form);
    if (ageMessage || !bathOk || missing.length || !signed) {
      if (ageMessage && dob) dob.focus();
      else if (!bathOk) form.querySelector('[name=bath]')?.focus();
      else if (missing.length) missing[0]?.focus();
      else form.querySelector('[name=signatureName]')?.focus();
      return;
    }
    if (checkoutReady()) startCheckout(form);
  });
  form.querySelector('.booking-pay')?.addEventListener('click', event => {
    if (event.currentTarget?.disabled) return;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
  });
  applyDraftCopy(documentRef);
  fillSignatureDate(form);
  syncAllergies(form);
  syncBath(form);
  syncTotal(documentRef);
  applySession(documentRef);
  mountRobeAddon(documentRef);
  applyRobeCutoff(documentRef);
  applyPayButton(documentRef);
}

if (typeof document !== 'undefined') initBooking(document);

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
export const BOOKING_CONFIRMATIONS = ['age', 'price', 'join', 'checkin', 'contact', 'deposit'];
/** Required only when the parent chooses BYOB. */
export const BYOB_CONFIRMATION = 'byob';
/** DRAFT pending CFO. Section 2 of the waiver e-signature draft, without the attorney note. */
export const WAIVER_HEADING = 'Assumption of risk and release (DRAFT).';
export const WAIVER_RELEASE_TEXT = `${WAIVER_HEADING} I am the parent or legal guardian of the baby named in this booking. I understand that a Lys Rose session is an educational, parent-led group class. I provide all hands-on care for my baby, and the instructor guides. Lys Rose doesn't offer facials, medical treatments, physical therapy or massage therapy. I understand the session has inherent risks, including: handling a wet, slippery baby in and around warm water; water that may be too warm or too cool; slips and falls on wet floors; a skin reaction or allergy to the products used (including the milk soak, oils, creams and floating rose petals); a baby mouthing or swallowing a petal or other small item; contact with shared, sanitized tools; and exposure to common illnesses in a group setting. I agree to keep my baby under my direct supervision and within my reach at all times. I voluntarily accept these risks for myself and my baby. To the fullest extent the law allows, I release Lys Rose LLC (doing business as Lys Rose Baby Spa), its owner, instructors and contractors from claims for injury or loss arising from these inherent risks.`;
/** Placeholder only. Do not replace this with drafted statutory language. Section 7.2. */
export const FLORIDA_STATUTORY_NOTICE = '[Florida statutory notice under Fla. Stat. 744.301(3): attorney to insert verbatim, in the required type.]';
/** DRAFT pending CFO. Lead-in from section 3, as amended in section 6. */
export const SIGNATURE_HEADING = 'Sign your waiver.';
export const SIGNATURE_LEAD_PARENT = `${SIGNATURE_HEADING} Please read the waiver above. By typing your full name and selecting "Sign and continue," you are signing electronically. Your typed name is your legal signature, just as if you'd signed on paper, and it applies to the waiver shown on this page. You confirm you're at least 18 and the baby's parent or legal guardian. We'll email you a copy of what you signed.`;
export const SIGNATURE_LEAD_ADULT = `${SIGNATURE_HEADING} Please read the waiver above. By typing your full name and selecting "Sign and continue," you are signing electronically. Your typed name is your legal signature, just as if you'd signed on paper, and it applies to the waiver shown on this page. You confirm you're at least 18 and attending with the baby's parent. We'll email you a copy of what you signed.`;
export const SIGNATURE_LEAD = SIGNATURE_LEAD_PARENT;
/** DRAFT pending Christy. */
export const CHECKOUT_WAIVER_NOTE = "After booking, we'll email you a waiver to sign online before your session.";
/** DRAFT pending Christy. */
export const SECOND_ADULT_WAIVER_NOTE = "Your second adult will receive their own waiver by email to sign before the session.";
/** The one extra adult besides the booking parent: the $25 second adult. */
export const MAX_EXTRA_ADULTS = 1;
export const WAIVER_SIGN_URL = 'https://forms.lysrosebabyspa.com/api/waiver';
export const WAIVER_ADD_URL = 'https://forms.lysrosebabyspa.com/api/waiver-adult';
/** DRAFT pending CFO. */
export const ESIGN_CONSENT = 'I agree to sign and receive these documents electronically. I can ask for a paper copy at any time by emailing hello@lysrosebabyspa.com.';
export const AGE_ACK = "My baby will be at least 4 weeks old and no older than 12 months on the session date, and my baby's umbilical cord stump has fallen off and the area is fully healed, my baby's skin has no breaks, and if my baby has been circumcised, the circumcision site is fully healed.";
export const PEDIATRICIAN_ACK = "I've talked with my pediatrician about the products and activities used in the session, and I know I can skip any part at any time.";
export const SKIP_ACK = "I understand there's no refund or discount for skipping any part of the session.";
export const JOIN_RULE_ACK = 'I understand my baby can only join if, in the 24 hours before the session, my baby has had no fever, vomiting or diarrhea, has no green nasal mucus, has no other signs of illness (such as a rash or cough), and has no breaks in the skin.';
export const BYOB_ACK = "I'm bringing my own breastmilk for my own baby. I will handle and add it myself, and Lys Rose does not store or handle it.";
export const WAIVER_DISCLAIMER = "Parents provide all hands-on care while our instructor guides. Lys Rose doesn't offer facials, medical treatments, physical therapy or massage therapy. Our sessions are educational.";
export const CLAUSE_A = "Age and health. I confirm that: (a) my baby will be at least 4 weeks old and no older than 12 months on the date of the session; (b) my baby's umbilical cord stump has fallen off and the area is fully healed; (c) my baby's skin has no breaks (no cuts, scrapes or open areas); (d) if my baby has been circumcised, the circumcision site is fully healed; and (e) my baby is healthy on the day of the session. I will tell the instructor at check-in if any of this changes before the session starts. I have talked with my baby's pediatrician about the products and activities used in the session, and I know I can skip any part of the session at any time. I understand that Lys Rose may ask for my baby's birth date, and that if the age (4 weeks to 12 months), the healed cord, unbroken skin or a healed circumcision site is in doubt at check-in, my baby will not be bathed.";
export const CLAUSE_B = "Products and skipping. I have read the list of products used in the session: the milk bath packet (colloidal oatmeal and coconut milk powder), floating rose petals, grapeseed massage oil, Mustela face moisturizer, and, only if I choose it, the Evereden face cream upgrade. I understand I will be asked to use a fragrance-free hand sanitizer and let my hands dry completely before handling my baby. I understand that I may skip any part of the session at any time by telling the instructor, and that skipping does not entitle me to any refund, credit or discount, because the session price stays the same. If I decline a paid upgrade, I will not be charged for it. I am responsible for telling Lys Rose at least 48 hours before my session about any allergy or sensitivity my baby or I have, including to any ingredient on the product list, and I may ask for the ingredient lists at any time.";
export const CLAUSE_C = "Bring your own breastmilk. If I choose BYOB, I will bring my own breastmilk for my own baby, cold (liquid) or frozen. I am solely responsible for the milk, including its storage, warming, and adding it to my baby's bath. Lys Rose does not provide, inspect, store, handle, or test breastmilk; it provides only a cup of warm water I can use to warm my sealed milk myself.";
export const ROSE_PETAL_CLAUSE = "Rose petals. I understand that the bath for my baby includes whole rose petals floating on the water for appearance only. The petals are not food. I will not let my baby eat or mouth the petals, and I will not place petals in my baby's mouth. I understand that petals can be a choking or breathing hazard if they get into a baby's mouth and that some babies react to flowers or pollen. I agree that my baby will stay under my direct supervision and within my arm's reach at all times during the session, including whenever my baby is near the water or the petals. I understand that I may choose a petal-free bath for my baby by ticking the box on the booking form or by telling the instructor at check-in, and that I may ask for the petals to be removed at any time. I will tell Lys Rose at least 48 hours before my session about any allergy or sensitivity my baby has, including to flowers or pollen.";
export const CLAUSE_D = "Sick baby. I confirm that in the 24 hours before the session my baby has had no fever, vomiting or diarrhea, has no green nasal mucus, and has no other signs of illness (such as a rash or cough) and no breaks in the skin. If I sign this more than 24 hours before the session, I promise these will be true at the session, and I will tell Lys Rose before the session if my baby becomes unwell. I understand the instructor may ask us not to join if my baby seems unwell at check-in. What happens to my payment then is set out in the booking policy.";
export const EMERGENCY_CLAUSE = "Emergency. If there's an emergency, Lys Rose may call 911. I'm responsible for decisions about my baby's care and for any medical costs. If I can't be reached in an emergency, Lys Rose may contact my emergency contact.";
export const INDEMNIFICATION_CLAUSE = '[Indemnification: attorney to decide whether to include, and its scope.]';
export const SEVERABILITY_CLAUSE = 'Severability. If any part of this waiver is found unenforceable, the rest still applies.';
export const FLORIDA_LAW_CLAUSE = 'Florida law. This waiver is governed by Florida law.';
export const VOLUNTARY_CLAUSE = "Voluntary. I've read this waiver, I understand it, and I'm signing it voluntarily.";
export const PARENT_SIGNATURE_SENTENCE = 'I am the parent or legal guardian of the baby named above. I sign this waiver for myself and on behalf of my baby.';
export const ADULT_18_ACK = "I'm at least 18";
export const PARENT_ROUTE_LABEL = "I'm the baby's parent or legal guardian";
/** The agreement version stored with each signature. Signed copies are not on the birth-date deletion schedule. */
export const BOOKING_TERMS_VERSION = 'booking-waiver-esignature-draft-2026-11-05';
export const WAIVER_RETENTION = 'attorney to set';
const DRAFT_ACKS = {
  join: JOIN_RULE_ACK,
  checkin: SICK_CHECKIN_ACK,
  contact: SICK_CONTACT_ACK,
  byob: BYOB_ACK,
};
const CLAUSE_LABELS = {
  a: 'Age and health.',
  b: 'Products and skipping.',
  c: 'Bring your own breastmilk.',
  d: 'Sick baby.',
  petals: 'Rose petals.',
  emergency: 'Emergency.',
  indemnify: '[Indemnification: attorney to decide whether to include, and its scope.]',
  severability: 'Severability.',
  florida: 'Florida law.',
  voluntary: 'Voluntary.',
};
const CLAUSE_BODIES = {
  a: CLAUSE_A.slice(CLAUSE_LABELS.a.length).trim(),
  b: CLAUSE_B.slice(CLAUSE_LABELS.b.length).trim(),
  c: CLAUSE_C.slice(CLAUSE_LABELS.c.length).trim(),
  d: CLAUSE_D.slice(CLAUSE_LABELS.d.length).trim(),
  petals: ROSE_PETAL_CLAUSE.slice(CLAUSE_LABELS.petals.length).trim(),
  emergency: EMERGENCY_CLAUSE.slice(CLAUSE_LABELS.emergency.length).trim(),
  indemnify: '',
  severability: SEVERABILITY_CLAUSE.slice(CLAUSE_LABELS.severability.length).trim(),
  florida: FLORIDA_LAW_CLAUSE.slice(CLAUSE_LABELS.florida.length).trim(),
  voluntary: VOLUNTARY_CLAUSE.slice(CLAUSE_LABELS.voluntary.length).trim(),
};

export function waiverIntro(babyName = "[baby's name]", sessionDate = '[date]') {
  return `This waiver is for ${babyName}'s Lys Rose session on ${sessionDate}. Please read it carefully. It affects your legal rights.`;
}

export function additionalAdultText(babyName = "[baby's name]") {
  return `Additional adult. I'm attending this session with ${babyName} and their parent or guardian. I've read this waiver. I accept the risks described in it for myself, and I release Lys Rose to the same extent for any claims of my own. I'll follow the instructor's and the parent's directions. I understand that I'm not signing on behalf of the baby, and that the baby's parent or guardian stays responsible for the baby's care and supervision.`;
}

export function signatureLead(part = 'parent') {
  return part === 'additional' ? SIGNATURE_LEAD_ADULT : SIGNATURE_LEAD_PARENT;
}

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

/** Exact text shown on the signer's page. The stored hash is of this string. */
export function signedDocumentText(details = {}) {
  const part = details.part === 'additional' ? 'additional' : 'parent';
  const babyName = details.babyName || "[baby's name]";
  const sessionDate = details.sessionDate || '[date]';
  return [
    "Part 1. Baby and session details",
    `Baby's full name: ${babyName}`,
    `Baby's birth date: ${details.babyDob || "[baby's birth date]"}`,
    `Session date: ${sessionDate}`,
    `Time: ${details.sessionTime || '[time]'}`,
    `Location: ${details.location || '[location]'}`,
    `Booking ID: ${details.bookingId || '[booking ID]'}`,
    `BYOB: ${details.byob ? 'Yes' : 'No'}`,
    'Part 2. Waiver terms',
    waiverIntro(babyName, sessionDate),
    WAIVER_DISCLAIMER,
    CLAUSE_A,
    CLAUSE_B,
    ...(details.byob ? [CLAUSE_C] : []),
    ROSE_PETAL_CLAUSE,
    CLAUSE_D,
    WAIVER_RELEASE_TEXT,
    EMERGENCY_CLAUSE,
    INDEMNIFICATION_CLAUSE,
    SEVERABILITY_CLAUSE,
    FLORIDA_LAW_CLAUSE,
    VOLUNTARY_CLAUSE,
    FLORIDA_STATUTORY_NOTICE,
    signatureLead(part),
    ESIGN_CONSENT,
    part === 'additional' ? additionalAdultText(babyName) : PARENT_SIGNATURE_SENTENCE,
    ADULT_18_ACK,
  ].join('\n');
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

/** Age is measured on the session date. A Date argument is that calendar day. A string is an ISO day. */
/** @param {string} iso @param {string | Date} [sessionDate] */
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
  for (const node of documentRef.querySelectorAll('[data-signature-rest]')) {
    const lead = node.getAttribute('data-signature-rest') === 'additional' ? SIGNATURE_LEAD_ADULT : SIGNATURE_LEAD_PARENT;
    node.textContent = lead.slice(SIGNATURE_HEADING.length).trim();
  }
  for (const node of documentRef.querySelectorAll('[data-waiver-disclaimer]')) node.textContent = WAIVER_DISCLAIMER;
  for (const node of documentRef.querySelectorAll('[data-clause-label]')) node.textContent = CLAUSE_LABELS[node.getAttribute('data-clause-label')] || '';
  for (const node of documentRef.querySelectorAll('[data-clause-body]')) node.textContent = CLAUSE_BODIES[node.getAttribute('data-clause-body')] || '';
  for (const node of documentRef.querySelectorAll('[data-parent-sentence]')) node.textContent = PARENT_SIGNATURE_SENTENCE;
  for (const node of documentRef.querySelectorAll('[data-adult-18]')) node.textContent = ADULT_18_ACK;
  for (const node of documentRef.querySelectorAll('[data-parent-route]')) node.textContent = PARENT_ROUTE_LABEL;
  for (const node of documentRef.querySelectorAll('[data-waiver-intro]')) node.textContent = waiverIntro();
  for (const node of documentRef.querySelectorAll('[data-additional-adult]')) node.textContent = additionalAdultText().slice('Additional adult.'.length).trim();
  for (const node of documentRef.querySelectorAll('[data-waiver-heading]')) node.textContent = WAIVER_HEADING;
  for (const node of documentRef.querySelectorAll('[data-waiver-body]')) node.textContent = WAIVER_RELEASE_TEXT.slice(WAIVER_HEADING.length).trim();
  for (const node of documentRef.querySelectorAll('[data-florida-notice]')) node.textContent = FLORIDA_STATUTORY_NOTICE;
  for (const node of documentRef.querySelectorAll('[data-checkout-waiver-note]')) node.textContent = CHECKOUT_WAIVER_NOTE;
  for (const node of documentRef.querySelectorAll('[data-second-adult-waiver-note]')) node.textContent = SECOND_ADULT_WAIVER_NOTE;
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
  return [...form.querySelectorAll('[name=confirmReady]')].filter(box => box.required && !box.checked);
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
  const byobBox = form.querySelector('[name=confirmReady][value=byob]');
  if (byobBox) {
    byobBox.required = byob;
    if (!byob) byobBox.checked = false;
  }
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

function pageOf(form) {
  return form.ownerDocument || form;
}

function secondAdultReady(form) {
  const page = pageOf(form);
  const selected = Boolean(page.querySelector('[name=secondAdult]')?.checked);
  if (!selected) return true;
  const name = page.querySelector('[name=secondAdultName]')?.value.trim() || '';
  const email = page.querySelector('[name=secondAdultEmail]')?.value.trim() || '';
  return /\p{L}/u.test(name) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function payReady(form) {
  const dob = form.querySelector('#baby-dob');
  const dobOk = Boolean(dob?.value) && !babyAgeMessage(dob.value, ageReference());
  const boxes = [...form.querySelectorAll('input[type=checkbox][required]')];
  return dobOk && boxes.length > 0 && boxes.every(box => box.checked) && secondAdultReady(form);
}

function syncSecondAdult(form) {
  const page = pageOf(form);
  const selected = Boolean(page.querySelector('[name=secondAdult]')?.checked);
  const fields = page.querySelector('#second-adult-fields');
  if (fields) fields.hidden = !selected;
  for (const input of (fields ? fields.querySelectorAll('input') : [])) input.required = selected;
}

/** Visible signing date. The stored signed_at stays UTC. */
export function signingDateLabel(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(now);
}

function fillSignatureDate(form) {
  const label = signingDateLabel();
  for (const input of form.querySelectorAll('[name=signatureDate]')) {
    if (!input.value) input.value = label;
  }
}

function signerPayload(root) {
  return {
    signatureName: root.querySelector('[name=signatureName]')?.value || '',
    email: root.querySelector('[name=signatureEmail]')?.value || '',
    relationship: root.querySelector('[name=relationship]')?.value || '',
    emergencyName: root.querySelector('[name=emergencyName]')?.value || '',
    emergencyPhone: root.querySelector('[name=emergencyPhone]')?.value || '',
    emergencyRelationship: root.querySelector('[name=emergencyRelationship]')?.value || '',
    adult18: Boolean(root.querySelector('[name=adult18]')?.checked),
    esignConsent: Boolean(root.querySelector('[name=esignConsent]')?.checked),
  };
}

function waiverPayload(form, token) {
  const part = form.querySelector('[name=signPart]')?.value === 'additional' ? 'additional' : 'parent';
  const primary = form.querySelector(part === 'additional' ? '#waiver-part-4-fields' : '#waiver-part-3-fields');
  const body = {token, part, ...signerPayload(primary)};
  const second = form.querySelector('#second-parent-fields');
  if (part === 'parent' && second && !second.hidden && (second.querySelector('[name=signatureName]')?.value || '').trim()) {
    body.secondParent = signerPayload(second);
  }
  return body;
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
    secondAdultName: page.querySelector('[name=secondAdultName]')?.value || '',
    secondAdultEmail: page.querySelector('[name=secondAdultEmail]')?.value || '',
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
      const fields = data.fields || {};
      const dob = form.querySelector('#baby-dob');
      if (dob && fields.babyDob) showAge(dob);
      if (fields.confirmReady) showConfirmations(form);
      show(fields.babyDob || fields.secondAdultName || fields.secondAdultEmail || fields.confirmReady || data.error || 'Checkout is not available yet.');
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
    if (event.target?.name === 'secondAdult') {
      syncSecondAdult(form);
      applyPayButton(documentRef);
    }
    if (event.target?.name === 'bath') syncBath(form);
  });
  form.addEventListener('change', event => {
    if (event.target?.name === 'allergies') syncAllergies(form);
    if (event.target?.name === 'confirmReady' || event.target?.name === 'waiver') {
      if (missingConfirmations(form).length === 0) showConfirmations(form);
      applyPayButton(documentRef);
    }
  });
  documentRef.addEventListener('input', event => {
    if (event.target?.name === 'secondAdultName' || event.target?.name === 'secondAdultEmail') applyPayButton(documentRef);
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
    const ageMessage = dob ? babyAgeMessage(dob.value, ageReference()) : '';
    if (dob) showAge(dob);
    const bathOk = showBath(form);
    const missing = showConfirmations(form);
    if (ageMessage || !bathOk || missing.length || !secondAdultReady(form)) {
      if (ageMessage && dob) dob.focus();
      else if (!bathOk) form.querySelector('[name=bath]')?.focus();
      else if (missing.length) missing[0]?.focus();
      else (form.ownerDocument || document).querySelector('[name=secondAdultName]')?.focus();
      return;
    }
    if (checkoutReady()) startCheckout(form);
  });
  form.querySelector('.booking-pay')?.addEventListener('click', event => {
    if (event.currentTarget?.disabled) return;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
  });
  applyDraftCopy(documentRef);
  syncSecondAdult(form);
  syncAllergies(form);
  syncBath(form);
  syncTotal(documentRef);
  applySession(documentRef);
  mountRobeAddon(documentRef);
  applyRobeCutoff(documentRef);
  applyPayButton(documentRef);
}

function emergencyReady(root, required) {
  const name = root.querySelector('[name=emergencyName]')?.value.trim() || '';
  const phone = root.querySelector('[name=emergencyPhone]')?.value.trim() || '';
  const relationship = root.querySelector('[name=emergencyRelationship]')?.value.trim() || '';
  const started = Boolean(name || phone || relationship);
  if (!required && !started) return true;
  return /\p{L}/u.test(name) && phone.replace(/\D/g, '').length >= 7 && /\p{L}/u.test(relationship);
}

function signerComplete(root, emergency = 'required') {
  if (!root || root.hidden) return true;
  const name = root.querySelector('[name=signatureName]')?.value.trim() || '';
  const email = root.querySelector('[name=signatureEmail]')?.value.trim() || '';
  const relationship = root.querySelector('[name=relationship]')?.value.trim() || '';
  const adult = Boolean(root.querySelector('[name=adult18]')?.checked);
  const consent = Boolean(root.querySelector('[name=esignConsent]')?.checked);
  return /\p{L}/u.test(name) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && relationship.length > 0 && adult && consent && emergencyReady(root, emergency === 'required');
}

function waiverReady(form) {
  const part = form.querySelector('[name=signPart]')?.value === 'additional' ? 'additional' : 'parent';
  const primary = form.querySelector(part === 'additional' ? '#waiver-part-4-fields' : '#waiver-part-3-fields');
  if (!signerComplete(primary, part === 'parent' ? 'required' : 'optional')) return false;
  const second = form.querySelector('#second-parent-fields');
  if (second && !second.hidden) {
    const started = ['signatureName', 'signatureEmail', 'relationship'].some(name => (second.querySelector(`[name=${name}]`)?.value || '').trim());
    if (started && !signerComplete(second)) return false;
  }
  return true;
}

function applyWaiverButton(form) {
  const button = form.querySelector('#waiver-sign-button');
  if (!button) return;
  const ready = waiverReady(form);
  button.disabled = !ready;
  button.setAttribute('aria-disabled', ready ? 'false' : 'true');
}

function showWaiverPart(documentRef, part) {
  const parent = documentRef.querySelector('#waiver-part-3');
  const adult = documentRef.querySelector('#waiver-part-4');
  const adultFields = documentRef.querySelector('#waiver-part-4-fields');
  const invite = documentRef.querySelector('[name=invitePart]')?.value || 'parent';
  const partInput = documentRef.querySelector('[name=signPart]');
  if (partInput) partInput.value = part;
  if (parent) parent.hidden = part !== 'parent';
  if (adult) adult.hidden = invite !== 'additional';
  if (adultFields) adultFields.hidden = part !== 'additional';
  for (const lead of documentRef.querySelectorAll('[data-signature-rest]')) {
    const which = lead.getAttribute('data-signature-rest') === 'additional' ? 'additional' : 'parent';
    lead.textContent = signatureLead(which).slice(SIGNATURE_HEADING.length).trim();
  }
}

function fillWaiverDetails(documentRef, details) {
  const map = {
    babyName: details.babyName,
    babyDob: details.babyDob,
    sessionDate: details.sessionDate,
    sessionTime: details.sessionTime,
    location: details.location,
    bookingId: details.bookingId,
    byob: details.byob ? 'Yes' : 'No',
  };
  for (const [key, value] of Object.entries(map)) {
    const node = documentRef.querySelector(`[data-part1=${key}]`);
    if (node && value) node.textContent = value;
  }
  const intro = documentRef.querySelector('[data-waiver-intro]');
  if (intro) intro.textContent = waiverIntro(details.babyName, details.sessionDate);
  const adultCopy = documentRef.querySelector('[data-additional-adult]');
  if (adultCopy) adultCopy.textContent = additionalAdultText(details.babyName).slice('Additional adult.'.length).trim();
  const clauseC = documentRef.querySelector('#waiver-clause-c');
  if (clauseC) clauseC.hidden = !details.byob;
}

export function initWaiver(documentRef = document) {
  const form = documentRef.querySelector('#waiver-form');
  if (!form) return;
  applyDraftCopy(documentRef);
  fillSignatureDate(form);
  const params = new URLSearchParams(documentRef.defaultView?.location?.search || '');
  const token = params.get('token') || '';
  const tokenInput = form.querySelector('[name=waiverToken]');
  if (tokenInput) tokenInput.value = token;
  const missing = documentRef.querySelector('#waiver-token-missing');
  if (missing) missing.hidden = Boolean(token);
  const inviteInput = form.querySelector('[name=invitePart]');
  if (inviteInput) inviteInput.value = 'parent';
  showWaiverPart(documentRef, 'parent');
  if (token) {
    fetch(`${WAIVER_SIGN_URL}?token=${encodeURIComponent(token)}`, {headers: {Accept: 'application/json'}})
      .then(response => response.ok ? response.json() : null)
      .then(details => {
        if (!details) return;
        fillWaiverDetails(documentRef, details);
        const part = details.part === 'additional' ? 'additional' : 'parent';
        if (inviteInput) inviteInput.value = part;
        showWaiverPart(documentRef, part);
        applyWaiverButton(form);
      })
      .catch(() => {});
  }
  form.addEventListener('change', event => {
    if (event.target?.name === 'signAsParent') {
      showWaiverPart(documentRef, event.target.checked ? 'parent' : 'additional');
    }
    applyWaiverButton(form);
  });
  form.addEventListener('input', () => applyWaiverButton(form));
  documentRef.querySelector('#add-second-parent')?.addEventListener('click', () => {
    const fields = documentRef.querySelector('#second-parent-fields');
    if (fields) fields.hidden = false;
    applyWaiverButton(form);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!waiverReady(form)) return;
    const error = form.querySelector('#waiver-error');
    const show = message => {
      if (!error) return;
      error.textContent = message;
      error.hidden = !message;
    };
    show('');
    try {
      const response = await fetch(WAIVER_SIGN_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify(waiverPayload(form, token)),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        show(data.error || 'This signing link is not valid.');
        return;
      }
      showWaiverConfirmation(documentRef, token, data.can_add !== false);
    } catch {
      show('This signing link is not available yet.');
    }
  });
  const add = documentRef.querySelector('#waiver-add-form');
  add?.addEventListener('submit', async event => {
    event.preventDefault();
    const status = documentRef.querySelector('#waiver-add-status');
    const name = add.querySelector('[name=additionalName]')?.value.trim() || '';
    const email = add.querySelector('[name=additionalEmail]')?.value.trim() || '';
    if (!/\p{L}/u.test(name) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (status) {
        status.hidden = false;
        status.textContent = 'Please enter their name and email.';
      }
      return;
    }
    try {
      const response = await fetch(WAIVER_ADD_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify({token, name, email}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (status) {
          status.hidden = false;
          status.textContent = data.error || 'Their waiver could not be sent.';
        }
        return;
      }
      if (status) {
        status.hidden = false;
        status.textContent = `A waiver link was prepared for ${name}.`;
      }
      add.reset();
      if (data.can_add === false) {
        const wrap = documentRef.querySelector('#waiver-add');
        if (wrap) wrap.hidden = true;
      }
    } catch {
      if (status) {
        status.hidden = false;
        status.textContent = 'Their waiver could not be sent yet.';
      }
    }
  });
  applyWaiverButton(form);
}

function showWaiverConfirmation(documentRef, token, canAdd) {
  const form = documentRef.querySelector('#waiver-form');
  const done = documentRef.querySelector('#waiver-confirmation');
  if (form) form.hidden = true;
  if (!done) return;
  done.hidden = false;
  const add = done.querySelector('#waiver-add');
  if (add) add.hidden = !canAdd;
  const holder = done.querySelector('[name=inviteToken]');
  if (holder) holder.value = token;
}

if (typeof document !== 'undefined') {
  if (document.querySelector('#waiver-form')) initWaiver(document);
  else initBooking(document);
}

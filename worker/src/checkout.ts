import {SESSION, SEATS_PER_SESSION, babyAgeMessage, bookingClosesAt, bookingIsClosed, robeIsClosed} from '../../assets/booking.js';

/**
 * Server-side prices in cents. The browser total is only a preview.
 * A null add-on price means that extra is hidden and cannot be purchased.
 * Taxes stay off until Florida registration is done and the CFO turns the flag on.
 */
export const TAX_ENABLED = false;
export const PRICES = {
  session: 28000,
  bath: {'floral-milk-soak': 0, byob: 0},
  petals: 0,
  creme: {signature: 0, gentle: 500, premium: 1000},
  robe: null as number | null,
  bathBag: null as number | null,
  secondAdult: null as number | null,
};

export const REDIRECT_PATH = '/book/thank-you/';
export const CHECKOUT_ORIGIN = 'https://lysrosebabyspa.com';
export const SQUARE_VERSION = '2025-10-16';

const CREME = new Set(['signature', 'gentle', 'premium']);
const BATH = new Set(['floral-milk-soak', 'byob']);
const CONFIRMATIONS = ['age', 'pediatrician', 'price'];
const BODY_LIMIT = 16384;

export type PriceTable = typeof PRICES;
export type BookingStore = {
  get(key: string, type?: 'text'): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};
export type CheckoutEnv = {
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_LOCATION_ID?: string;
  SQUARE_ENV?: string;
  SQUARE_WEBHOOK_SIGNATURE_KEY?: string;
  TAX_ENABLED?: string;
  BOOKINGS?: BookingStore;
};
type SessionConfig = {date?: string; start?: string; end?: string} | null;
export type LineItem = {name: string; quantity: string; base_price_money: {amount: number; currency: 'USD'}};
export type BookingRecord = {
  parentName: string;
  email: string;
  phone: string;
  babyName: string;
  babyDob: string;
  bath: string;
  creme: string;
  petals: boolean;
  robe: boolean;
  robeName: string;
  bathBag: boolean;
  secondAdult: boolean;
  allergies: string;
  allergyDetails: string;
};
export type PreparedOrder = {
  lines: LineItem[];
  note: string;
  total: number;
  referenceId: string;
  closesAt: number;
  sessionDate: string;
  booking: BookingRecord;
};

export function memoryStore(): BookingStore {
  const map = new Map<string, string>();
  return {
    async get(key) { return map.has(key) ? map.get(key)! : null; },
    async put(key, value) { map.set(key, value); },
  };
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function flag(value: unknown) {
  return value === true || value === 'yes' || value === 'true' || value === 'on';
}

function confirmationSet(raw: Record<string, unknown>) {
  const values = Array.isArray(raw.confirmReady) ? raw.confirmReady.map(item => String(item)) : [];
  if (raw.confirmations && typeof raw.confirmations === 'object') {
    for (const key of CONFIRMATIONS) if ((raw.confirmations as Record<string, unknown>)[key] === true) values.push(key);
  }
  return new Set(values);
}

export function taxesEnabled(env: CheckoutEnv = {}) {
  if (env.TAX_ENABLED === 'true') return true;
  if (env.TAX_ENABLED === 'false') return false;
  return TAX_ENABLED;
}

export function validateBooking(raw: unknown, options: {session?: SessionConfig; now?: Date; prices?: PriceTable} = {}) {
  const session = options.session === undefined ? SESSION : options.session;
  const now = options.now || new Date();
  const prices = options.prices || PRICES;
  const errors: Record<string, string> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {ok: false as const, status: 400, errors: {form: 'Please check the booking form.'}};
  }
  const data = {...(raw as Record<string, unknown>)};
  for (const key of ['price', 'prices', 'amount', 'total', 'lineItems', 'cents', 'base_price_money']) delete data[key];
  if (!session?.date) return {ok: false as const, status: 409, errors: {session: 'Booking is not open.'}};
  if (bookingIsClosed(session, now)) return {ok: false as const, status: 409, errors: {session: 'Booking for this session has closed.'}};

  const parentName = text(data.parentName, 100);
  const email = text(data.email, 254);
  const phone = text(data.phone, 30);
  const babyName = text(data.babyName, 100);
  const babyDob = text(data.babyDob, 10);
  if (!parentName || !/\p{L}/u.test(parentName)) errors.parentName = 'Please enter your name.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (!phone || phone.replace(/\D/g, '').length < 7) errors.phone = 'Please enter a phone number.';
  if (!babyName) errors.babyName = "Please enter your baby's name.";
  const age = babyAgeMessage(babyDob, now);
  if (age) errors.babyDob = age;
  const bath = text(data.bath, 40);
  if (!BATH.has(bath)) errors.bath = 'Please choose a bath.';
  const creme = text(data.creme, 20) || text(data.faceCream, 20);
  if (!CREME.has(creme)) errors.creme = 'Please choose a crème.';
  const confirmed = confirmationSet(data);
  if (CONFIRMATIONS.some(item => !confirmed.has(item))) errors.confirmReady = 'Please confirm each item before reserving.';
  const robe = flag(data.robe);
  const bathBag = flag(data.bathBag);
  const secondAdult = flag(data.secondAdult);
  const petals = bath === 'byob' && flag(data.petals ?? data.rosePetals);
  if (robe && prices.robe == null) errors.robe = "That extra isn't available.";
  if (robe && prices.robe != null && robeIsClosed(session.date, now)) errors.robe = 'The embroidered robe option has closed for this session.';
  if (bathBag && prices.bathBag == null) errors.bathBag = "That extra isn't available.";
  if (secondAdult && prices.secondAdult == null) errors.secondAdult = "That extra isn't available.";
  if (Object.keys(errors).length) return {ok: false as const, status: 400, errors};
  const booking: BookingRecord = {
    parentName, email, phone, babyName, babyDob, bath, creme, petals, robe, bathBag, secondAdult,
    robeName: robe ? text(data.robeName, 40) : '',
    allergies: text(data.allergies, 40),
    allergyDetails: text(data.allergyDetails, 500),
  };
  return {ok: true as const, booking, session};
}

export function buildOrder(booking: BookingRecord, prices: PriceTable = PRICES, session: SessionConfig = null): PreparedOrder {
  const lines: LineItem[] = [{
    name: 'Lys Rose session',
    quantity: '1',
    base_price_money: {amount: prices.session, currency: 'USD'},
  }];
  const notes = [`Bath: ${booking.bath === 'byob' ? 'BYOB (bring your own breastmilk)' : 'Floral Milk Soak'}`];
  if (booking.bath === 'byob') notes.push(`Complimentary rose petals: ${booking.petals ? 'yes' : 'no'}`);
  const cremePrice = prices.creme[booking.creme as keyof typeof prices.creme] ?? 0;
  if (cremePrice > 0) {
    lines.push({
      name: booking.creme === 'premium' ? 'Premium face crème' : 'Gentle face crème',
      quantity: '1',
      base_price_money: {amount: cremePrice, currency: 'USD'},
    });
  } else notes.push('Crème: Signature');
  const extras: Array<[boolean, number | null, string]> = [
    [booking.robe, prices.robe, booking.robeName ? `Embroidered keepsake robe (${booking.robeName})` : 'Embroidered keepsake robe'],
    [booking.bathBag, prices.bathBag, 'Floral Milk Bath Bag'],
    [booking.secondAdult, prices.secondAdult, 'Second adult'],
  ];
  for (const [selected, amount, name] of extras) {
    if (selected && amount != null) lines.push({name, quantity: '1', base_price_money: {amount, currency: 'USD'}});
  }
  const total = lines.reduce((sum, line) => sum + line.base_price_money.amount, 0);
  const referenceId = `lys-${booking.email}-${booking.babyDob}-${booking.bath}-${booking.creme}`.replace(/[^a-z0-9-]/gi, '').slice(0, 40);
  return {lines, note: notes.join('. '), total, referenceId, closesAt: bookingClosesAt(session), sessionDate: session?.date || '', booking};
}

type CatalogVariation = {name: string; amount: number; currency: 'USD'};
type CatalogItem = {name: string; create: boolean; amount?: number | null; currency?: 'USD'; variations?: CatalogVariation[]};

export function catalogPlan(prices: PriceTable = PRICES) {
  const item = (name: string, amount: number | null): CatalogItem => ({name, amount, currency: 'USD', create: amount != null});
  return {
    taxes: taxesEnabled() ? 'auto' : 'off',
    items: [
      {name: 'Lys Rose Session', create: true, variations: [
        {name: 'Floral Milk Soak', amount: prices.session, currency: 'USD' as const},
        {name: 'BYOB', amount: prices.session, currency: 'USD' as const},
      ]},
      item('Signature face crème', prices.creme.signature),
      item('Gentle face crème', prices.creme.gentle),
      item('Premium face crème', prices.creme.premium),
      item('Embroidered keepsake robe', prices.robe),
      item('Floral Milk Bath Bag', prices.bathBag),
      item('Second adult', prices.secondAdult),
    ] as CatalogItem[],
  };
}

export function catalogUpsertObjects(prices: PriceTable = PRICES) {
  const objects = [];
  for (const item of catalogPlan(prices).items) {
    if (item.variations) {
      objects.push({
        type: 'ITEM',
        id: '#lys-rose-session',
        item_data: {
          name: item.name,
          variations: item.variations.map(variation => ({
            type: 'ITEM_VARIATION',
            id: `#${variation.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            item_variation_data: {
              name: variation.name,
              pricing_type: 'FIXED_PRICING',
              price_money: {amount: variation.amount, currency: 'USD'},
            },
          })),
        },
      });
      continue;
    }
    if (!item.create || item.amount == null) continue;
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    objects.push({
      type: 'ITEM',
      id: `#${slug}`,
      item_data: {
        name: item.name,
        variations: [{
          type: 'ITEM_VARIATION',
          id: `#${slug}-price`,
          item_variation_data: {
            name: item.name,
            pricing_type: 'FIXED_PRICING',
            price_money: {amount: item.amount, currency: 'USD'},
          },
        }],
      },
    });
  }
  return objects;
}

export function squareApiHost(envName?: string) {
  return envName === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
}

export async function idempotencyKey(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hex = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function openCheckout(order: PreparedOrder, buyerEmail: string, env: CheckoutEnv, fetchImpl: typeof fetch = fetch) {
  if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_LOCATION_ID || !env.BOOKINGS) {
    return {ok: false as const, status: 503, error: 'Checkout is not available yet.'};
  }
  const key = await idempotencyKey(`${order.referenceId}:${order.total}:${buyerEmail}`);
  let response: Response;
  try {
    response = await fetchImpl(`${squareApiHost(env.SQUARE_ENV)}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': SQUARE_VERSION,
      },
      body: JSON.stringify({
        idempotency_key: key,
        order: {
          location_id: env.SQUARE_LOCATION_ID,
          reference_id: order.referenceId,
          line_items: order.lines,
          pricing_options: {auto_apply_taxes: taxesEnabled(env)},
        },
        checkout_options: {redirect_url: `${CHECKOUT_ORIGIN}${REDIRECT_PATH}`},
        pre_populated_data: {buyer_email: buyerEmail},
        payment_note: order.note,
      }),
    });
  } catch {
    return {ok: false as const, status: 502, error: 'Checkout is not available yet.'};
  }
  if (!response.ok) return {ok: false as const, status: 502, error: 'Checkout is not available yet.'};
  const payload = await response.json() as {payment_link?: {url?: string; order_id?: string}};
  const url = payload.payment_link?.url;
  const orderId = payload.payment_link?.order_id;
  if (!url || !orderId) return {ok: false as const, status: 502, error: 'Checkout is not available yet.'};
  await env.BOOKINGS.put(`order:${orderId}`, JSON.stringify({
    referenceId: order.referenceId,
    total: order.total,
    note: order.note,
    email: buyerEmail,
    closesAt: Number.isFinite(order.closesAt) ? order.closesAt : null,
    sessionDate: order.sessionDate,
    booking: order.booking,
  }));
  return {ok: true as const, url, orderId};
}

export function timingSafeEqual(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  const length = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] || 0) ^ (b[index] || 0);
  return mismatch === 0;
}

export async function squareSignature(url: string, body: string, key: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(url + body));
  let binary = '';
  for (const byte of new Uint8Array(mac)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function signatureMatches(url: string, body: string, key: string, header: string | null) {
  if (!header || !key) return false;
  return timingSafeEqual(await squareSignature(url, body, key), header);
}

type PaymentEvent = {id?: string; status?: string; order_id?: string; created_at?: string};

export function paymentFromEvent(payload: unknown): PaymentEvent | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as {type?: string; data?: {object?: {payment?: PaymentEvent}}};
  if (data.type !== 'payment.updated' && data.type !== 'payment.created') return null;
  const payment = data.data?.object?.payment;
  if (!payment || payment.status !== 'COMPLETED' || !payment.id) return null;
  return payment;
}

/**
 * Seats are held only after a verified payment. CreatePaymentLink does not expire the link,
 * so this compares payment.created_at with the booking cutoff stored on the order.
 * A full session, a late payment, or an unknown order is stored as refund-flagged.
 * This does not call Square's refund API.
 */
export async function recordCompletedPayment(store: BookingStore, payment: PaymentEvent) {
  const existing = await store.get(`payment:${payment.id}`);
  if (existing) return {ok: true as const, duplicate: true, ...(JSON.parse(existing) as {status: string; refundFlag: boolean; reason: string})};
  const orderRaw = payment.order_id ? await store.get(`order:${payment.order_id}`) : null;
  const order = orderRaw ? JSON.parse(orderRaw) as {closesAt?: number | null; sessionDate?: string; booking?: BookingRecord; email?: string; total?: number} : null;
  const paidAt = Date.parse(payment.created_at || '');
  const seatKey = order?.sessionDate ? `seats:${order.sessionDate}` : 'seats:unscoped';
  const reserved = Number(await store.get(seatKey) || '0');
  let reason = 'paid';
  if (!order) reason = 'missing-order';
  else if (order.closesAt != null && Number.isFinite(paidAt) && paidAt >= order.closesAt) reason = 'after-cutoff';
  else if (reserved >= SEATS_PER_SESSION) reason = 'full';
  const refundFlag = reason !== 'paid';
  const record = {
    paymentId: payment.id,
    orderId: payment.order_id || '',
    status: refundFlag ? 'refund-flagged' : 'confirmed',
    refundFlag,
    reason,
  };
  if (!refundFlag) await store.put(seatKey, String(reserved + 1));
  await store.put(`payment:${payment.id}`, JSON.stringify(record));
  await store.put(`booking:${payment.id}`, JSON.stringify({
    ...(order?.booking || {}),
    email: order?.email || order?.booking?.email || '',
    total: order?.total ?? null,
    paymentId: payment.id,
    orderId: payment.order_id || '',
    status: record.status,
    refundFlag,
    reason,
    recordedAt: new Date().toISOString(),
  }));
  return {ok: true as const, duplicate: false, ...record};
}

const checkoutOrigins = new Set(['https://lysrosebabyspa.com', 'https://www.lysrosebabyspa.com', 'https://bsstaveley87.github.io']);

async function readLimited(request: Request) {
  const declared = Number(request.headers.get('Content-Length') || '0');
  if (declared > BODY_LIMIT) return null;
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > BODY_LIMIT) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function checkoutHeaders(origin: string) {
  const headers = new Headers({'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin'});
  if (checkoutOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return headers;
}

export async function handleCheckoutRequest(request: Request, env: CheckoutEnv, fetchImpl: typeof fetch = fetch, now = new Date(), session: SessionConfig | undefined = undefined) {
  const origin = request.headers.get('Origin') || '';
  const headers = checkoutHeaders(origin);
  if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
  if (!checkoutOrigins.has(origin)) return new Response(JSON.stringify({error: 'Origin not allowed.'}), {status: 403, headers});
  if (request.method !== 'POST') return new Response(JSON.stringify({error: 'Method not allowed.'}), {status: 405, headers});
  const rawText = await readLimited(request);
  if (rawText == null) return new Response(JSON.stringify({error: 'Please check the booking form.'}), {status: 413, headers});
  let raw: unknown;
  try { raw = JSON.parse(rawText); } catch { return new Response(JSON.stringify({error: 'Please check the booking form.'}), {status: 400, headers}); }
  const checked = validateBooking(raw, {now, session});
  if (!checked.ok) return new Response(JSON.stringify({error: 'Please check the booking form.', fields: checked.errors}), {status: checked.status, headers});
  const order = buildOrder(checked.booking, PRICES, checked.session);
  const opened = await openCheckout(order, checked.booking.email, env, fetchImpl);
  if (!opened.ok) return new Response(JSON.stringify({error: opened.error}), {status: opened.status, headers});
  console.log(JSON.stringify({event: 'checkout_link_created'}));
  return new Response(JSON.stringify({url: opened.url}), {status: 200, headers});
}

export async function handleWebhookRequest(request: Request, env: CheckoutEnv) {
  if (request.method !== 'POST') return new Response('Method not allowed.', {status: 405});
  if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY || !env.BOOKINGS) return new Response('Webhook is not configured.', {status: 503});
  const body = await readLimited(request);
  if (body == null) return new Response('Invalid event.', {status: 413});
  const valid = await signatureMatches(request.url, body, env.SQUARE_WEBHOOK_SIGNATURE_KEY, request.headers.get('x-square-hmacsha256-signature'));
  if (!valid) return new Response('Invalid signature.', {status: 401});
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return new Response('Invalid event.', {status: 400}); }
  const payment = paymentFromEvent(payload);
  if (!payment) return new Response(JSON.stringify({ignored: true}), {status: 200, headers: {'Content-Type': 'application/json'}});
  const result = await recordCompletedPayment(env.BOOKINGS, payment);
  console.log(JSON.stringify({event: 'booking_recorded', status: result.status, duplicate: result.duplicate}));
  return new Response(JSON.stringify({ok: true, status: result.status, duplicate: result.duplicate, refundFlag: result.refundFlag}), {status: 200, headers: {'Content-Type': 'application/json'}});
}

export async function routeCheckout(request: Request, env: CheckoutEnv, fetchImpl: typeof fetch = fetch, now = new Date(), session: SessionConfig | undefined = undefined) {
  const path = new URL(request.url).pathname;
  if (path === '/api/checkout') return handleCheckoutRequest(request, env, fetchImpl, now, session);
  if (path === '/api/square-webhook') return handleWebhookRequest(request, env);
  return null;
}

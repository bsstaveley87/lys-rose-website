import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {CHECKOUT_CONFIGURED, CHECKOUT_URL, SESSION} from '../assets/booking.js';
import {
  PRICES,
  TAX_ENABLED,
  taxesEnabled,
  buildOrder,
  catalogPlan,
  catalogUpsertObjects,
  handleCheckoutRequest,
  handleWebhookRequest,
  memoryStore,
  openCheckout,
  routeCheckout,
  squareApiHost,
  squareSignature,
  validateBooking,
} from '../worker/src/checkout.ts';

const session = {date: '2026-12-06', start: '10:30', end: '12:30'};
const openNow = new Date(2026, 10, 1);
const closedNow = new Date('2026-12-04T15:30:00Z');

function form(overrides = {}) {
  return {
    parentName: 'Christy Zemour',
    email: 'parent@example.com',
    phone: '954-555-0100',
    babyName: 'Lily',
    babyDob: '2026-09-01',
    bath: 'floral-milk-soak',
    creme: 'signature',
    confirmReady: ['age', 'pediatrician', 'price'],
    ...overrides,
  };
}

function env(store = memoryStore()) {
  return {
    SQUARE_ACCESS_TOKEN: 'test-token',
    SQUARE_LOCATION_ID: 'LOC123',
    SQUARE_ENV: 'sandbox',
    SQUARE_WEBHOOK_SIGNATURE_KEY: 'signature-key',
    TAX_ENABLED: 'false',
    BOOKINGS: store,
  };
}

function checkoutRequest(body, origin = 'https://lysrosebabyspa.com') {
  return new Request('https://forms.lysrosebabyspa.com/api/checkout', {
    method: 'POST',
    headers: {Origin: origin, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
}

test('price table ignores tampered client prices and keeps taxes off', async () => {
  assert.equal(TAX_ENABLED, false);
  assert.equal(taxesEnabled(), false);
  assert.equal(taxesEnabled({TAX_ENABLED: 'false'}), false);
  assert.equal(taxesEnabled({TAX_ENABLED: 'true'}), true);
  assert.equal(PRICES.session, 28000);
  assert.deepEqual(PRICES.creme, {signature: 0, gentle: 500, premium: 1000});
  assert.equal(PRICES.bath['floral-milk-soak'], 0);
  assert.equal(PRICES.bath.byob, 0);
  assert.equal(PRICES.petals, 0);
  assert.equal(PRICES.robe, null);
  assert.equal(PRICES.bathBag, null);
  assert.equal(PRICES.secondAdult, null);
  assert.equal(SESSION, null);
  assert.equal(CHECKOUT_CONFIGURED, false);
  assert.equal(CHECKOUT_URL.includes('square'), false);

  const tampered = form({
    creme: 'premium',
    bath: 'byob',
    rosePetals: 'yes',
    price: 100,
    total: 100,
    amount: 1,
    lineItems: [{name: 'Free session', base_price_money: {amount: 1, currency: 'USD'}}],
  });
  const checked = validateBooking(tampered, {session, now: openNow});
  assert.equal(checked.ok, true);
  const order = buildOrder(checked.booking, PRICES, session);
  assert.deepEqual(order.lines.map(line => [line.name, line.base_price_money.amount]), [
    ['Lys Rose session', 28000],
    ['Premium face crème', 1000],
  ]);
  assert.equal(order.total, 29000);
  assert.match(order.note, /BYOB/);
  assert.match(order.note, /rose petals: yes/);
  assert.equal(order.lines.some(line => line.base_price_money.amount === 1), false);

  const signature = buildOrder(validateBooking(form(), {session, now: openNow}).booking, PRICES, session);
  assert.equal(signature.total, 28000);
  assert.equal(signature.lines.length, 1);
  assert.match(signature.note, /Crème: Signature/);

  const gentle = buildOrder(validateBooking(form({creme: 'gentle', faceCream: 'gentle'}), {session, now: openNow}).booking, PRICES, session);
  assert.equal(gentle.total, 28500);
  assert.equal(gentle.lines[1].name, 'Gentle face crème');
  assert.equal(gentle.lines[1].base_price_money.amount, 500);

  let captured;
  const fetchImpl = async (url, init) => {
    captured = {url, body: JSON.parse(init.body), authorization: init.headers.Authorization};
    return new Response(JSON.stringify({payment_link: {url: 'https://sandbox.square.link/u/preview', order_id: 'ord_1'}}), {status: 200});
  };
  const response = await handleCheckoutRequest(checkoutRequest(tampered), env(), fetchImpl, openNow, session);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {url: 'https://sandbox.square.link/u/preview'});
  assert.equal(captured.url, 'https://connect.squareupsandbox.com/v2/online-checkout/payment-links');
  assert.equal(captured.body.order.pricing_options.auto_apply_taxes, false);
  assert.equal(captured.body.pre_populated_data.buyer_email, 'parent@example.com');
  assert.equal(captured.body.checkout_options.redirect_url, 'https://lysrosebabyspa.com/book/thank-you/');
  assert.equal(captured.body.order.line_items[0].base_price_money.amount, 28000);
  assert.equal(captured.body.order.line_items[1].base_price_money.amount, 1000);
  assert.equal(captured.body.order.location_id, 'LOC123');
  assert.match(captured.authorization, /^Bearer /);
  assert.deepEqual(captured.body.order.line_items.map(line => line.base_price_money.amount), [28000, 1000]);
});

test('closed session, age, robe cutoff, and hidden extras never open checkout', async () => {
  const calls = [];
  const fetchImpl = async () => { calls.push(1); return new Response('no', {status: 500}); };
  const closed = await handleCheckoutRequest(checkoutRequest(form()), env(), fetchImpl, closedNow, session);
  assert.equal(closed.status, 409);
  assert.match((await closed.json()).fields.session, /closed/);
  const unannounced = await handleCheckoutRequest(checkoutRequest(form()), env(), fetchImpl);
  assert.equal(unannounced.status, 409);
  assert.match((await unannounced.json()).fields.session, /not open/);
  const young = validateBooking(form({babyDob: '2026-10-02'}), {session, now: new Date(2026, 9, 29)});
  assert.equal(young.ok, false);
  assert.match(young.errors.babyDob, /4 weeks/);
  const robePrices = {...PRICES, robe: 4500, bathBag: 1800, secondAdult: 4000};
  const robeClosed = validateBooking(form({robe: true, robeName: 'Lily'}), {session, now: new Date('2026-11-23T05:00:00Z'), prices: robePrices});
  assert.equal(robeClosed.ok, false);
  assert.match(robeClosed.errors.robe, /closed/);
  const hidden = validateBooking(form({robe: true, bathBag: true, secondAdult: true}), {session, now: openNow});
  assert.equal(hidden.ok, false);
  assert.match(hidden.errors.robe, /isn't available/);
  const openRobe = validateBooking(form({robe: true, robeName: 'Lily', bathBag: true, secondAdult: true}), {session, now: openNow, prices: robePrices});
  assert.equal(openRobe.ok, true);
  const priced = buildOrder(openRobe.booking, robePrices, session);
  assert.equal(priced.total, 28000 + 4500 + 1800 + 4000);
  assert.match(priced.lines[1].name, /Lily/);
  assert.equal(calls.length, 0);
  const missing = await openCheckout(buildOrder(validateBooking(form(), {session, now: openNow}).booking, PRICES, session), 'parent@example.com', {BOOKINGS: memoryStore()}, fetchImpl);
  assert.equal(missing.status, 503);
  assert.equal(calls.length, 0);
});

test('webhook verifies the signature, counts a seat once, and flags late or extra payments', async () => {
  const store = memoryStore();
  const key = 'signature-key';
  const url = 'https://forms.lysrosebabyspa.com/api/square-webhook';
  await store.put('order:ord_1', JSON.stringify({
    closesAt: Date.parse('2026-12-04T15:30:00Z'),
    sessionDate: '2026-12-06',
    email: 'parent@example.com',
    total: 28000,
    booking: {babyName: 'Lily', email: 'parent@example.com'},
  }));
  const event = {
    type: 'payment.updated',
    data: {object: {payment: {id: 'pay_1', status: 'COMPLETED', order_id: 'ord_1', created_at: '2026-12-01T15:00:00Z'}}},
  };
  const body = JSON.stringify(event);
  const signature = await squareSignature(url, body, key);
  const unconfigured = await handleWebhookRequest(new Request(url, {method: 'POST', body}), {BOOKINGS: store});
  assert.equal(unconfigured.status, 503);
  assert.equal(await store.get('seats:2026-12-06'), null);
  const bad = await handleWebhookRequest(new Request(url, {method: 'POST', headers: {'x-square-hmacsha256-signature': 'nope'}, body}), env(store));
  assert.equal(bad.status, 401);
  assert.equal(await store.get('seats:2026-12-06'), null);
  const ok = await handleWebhookRequest(new Request(url, {method: 'POST', headers: {'x-square-hmacsha256-signature': signature}, body}), env(store));
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), {ok: true, status: 'confirmed', duplicate: false, refundFlag: false});
  assert.equal(await store.get('seats:2026-12-06'), '1');
  const booking = JSON.parse(await store.get('booking:pay_1'));
  assert.equal(booking.babyName, 'Lily');
  assert.equal(booking.status, 'confirmed');
  const again = await handleWebhookRequest(new Request(url, {method: 'POST', headers: {'x-square-hmacsha256-signature': signature}, body}), env(store));
  assert.equal((await again.json()).duplicate, true);
  assert.equal(await store.get('seats:2026-12-06'), '1');

  const lateBody = JSON.stringify({
    type: 'payment.created',
    data: {object: {payment: {id: 'pay_late', status: 'COMPLETED', order_id: 'ord_1', created_at: '2026-12-04T15:30:00Z'}}},
  });
  const late = await handleWebhookRequest(new Request(url, {method: 'POST', headers: {'x-square-hmacsha256-signature': await squareSignature(url, lateBody, key)}, body: lateBody}), env(store));
  const lateResult = await late.json();
  assert.equal(lateResult.refundFlag, true);
  assert.equal(lateResult.status, 'refund-flagged');
  assert.equal(await store.get('seats:2026-12-06'), '1');

  await store.put('seats:2026-12-06', '12');
  const fullBody = JSON.stringify({
    type: 'payment.updated',
    data: {object: {payment: {id: 'pay_full', status: 'COMPLETED', order_id: 'ord_1', created_at: '2026-12-01T16:00:00Z'}}},
  });
  const full = await handleWebhookRequest(new Request(url, {method: 'POST', headers: {'x-square-hmacsha256-signature': await squareSignature(url, fullBody, key)}, body: fullBody}), env(store));
  const fullResult = await full.json();
  assert.equal(fullResult.refundFlag, true);
  assert.equal(fullResult.status, 'refund-flagged');
  assert.equal(await store.get('seats:2026-12-06'), '12');
  assert.equal(JSON.stringify(fullResult).includes('12'), false);

  const ignoredBody = JSON.stringify({type: 'payment.updated', data: {object: {payment: {id: 'pay_pending', status: 'APPROVED', order_id: 'ord_1'}}}});
  const ignored = await handleWebhookRequest(new Request(url, {method: 'POST', headers: {'x-square-hmacsha256-signature': await squareSignature(url, ignoredBody, key)}, body: ignoredBody}), env(store));
  assert.deepEqual(await ignored.json(), {ignored: true});
  assert.equal(await routeCheckout(new Request('https://forms.lysrosebabyspa.com/waitlist', {method: 'POST'})), null);
});

test('catalog plan prices the session variations together and skips null extras', () => {
  const plan = catalogPlan();
  assert.equal(plan.taxes, 'off');
  const sessionItem = plan.items[0];
  assert.equal(sessionItem.name, 'Lys Rose Session');
  assert.deepEqual(sessionItem.variations.map(item => item.amount), [28000, 28000]);
  assert.deepEqual(sessionItem.variations.map(item => item.name), ['Floral Milk Soak', 'BYOB']);
  const objects = catalogUpsertObjects();
  assert.equal(objects.some(item => item.item_data.name === 'Embroidered keepsake robe'), false);
  assert.equal(objects.some(item => item.item_data.name === 'Floral Milk Bath Bag'), false);
  assert.equal(objects.some(item => item.item_data.name === 'Second adult'), false);
  assert.equal(objects.find(item => item.id === '#lys-rose-session').item_data.variations[0].item_variation_data.price_money.amount, 28000);
  assert.equal(squareApiHost('production'), 'https://connect.squareup.com');
  assert.equal(squareApiHost('sandbox'), 'https://connect.squareupsandbox.com');
  assert.equal(squareApiHost(undefined), 'https://connect.squareupsandbox.com');
});

test('catalog script stays a dry run unless credentials are present', async () => {
  const config = await readFile(new URL('../worker/cloudflare.config.ts', import.meta.url), 'utf8');
  assert.match(config, /TAX_ENABLED: bindings\.text\('false'\)/);
  assert.match(config, /SQUARE_ACCESS_TOKEN: bindings\.secret\(\)/);
  assert.match(config, /BOOKINGS: bindings\.kv\(\)/);
  assert.equal(/sq0|EAAA/.test(config), false);
  const dry = spawnSync(process.execPath, ['scripts/square-catalog.mjs'], {encoding: 'utf8', env: {...process.env, SQUARE_ACCESS_TOKEN: '', SQUARE_LOCATION_ID: ''}});
  assert.equal(dry.status, 0);
  assert.match(dry.stdout, /Lys Rose Session/);
  assert.match(dry.stdout, /Floral Milk Soak/);
  assert.match(dry.stdout, /BYOB/);
  assert.match(dry.stdout, /Gentle face crème/);
  assert.match(dry.stdout, /Embroidered keepsake robe/);
  assert.match(dry.stdout, /Floral Milk Bath Bag/);
  assert.match(dry.stdout, /Second adult/);
  assert.match(dry.stdout, /"mode": "dry-run"/);
  assert.match(dry.stdout, /No Square request was sent/);
  const apply = spawnSync(process.execPath, ['scripts/square-catalog.mjs', '--apply'], {encoding: 'utf8', env: {...process.env, SQUARE_ACCESS_TOKEN: '', SQUARE_LOCATION_ID: '', SQUARE_ENV: 'sandbox'}});
  assert.notEqual(apply.status, 0);
  assert.match(apply.stderr, /No Square request was sent/);
});

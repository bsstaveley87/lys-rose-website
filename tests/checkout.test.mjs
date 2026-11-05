import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {CHECKOUT_CONFIGURED, CHECKOUT_URL, SESSION, SESSION_PRICE_CENTS} from '../assets/booking.js';
import {
  PRICES,
  TAX_ENABLED,
  TAX_RATE,
  salesTaxCents,
  squareOrderPayload,
  taxesEnabled,
  buildOrder,
  catalogPlan,
  catalogUpsertObjects,
  handleCheckoutRequest,
  handleWebhookRequest,
  memoryStore,
  openCheckout,
  routeCheckout,
  addWaiverAdult,
  signWaiverRequest,
  waiverLink,
  sha256Hex,
  squareApiHost,
  squareSignature,
  validateBooking,
} from '../worker/src/checkout.ts';
import {sessionDateLabel, sessionTimeLabel, signedDocumentText} from '../assets/booking.js';

const session = {date: '2026-12-06', start: '10:30', end: '12:30'};
const sessionLine = 'Lys Rose session · Sun Dec 6, 10:30 AM';
const openNow = new Date(2026, 10, 1);
const closedNow = new Date('2026-12-04T15:30:00Z');

function form(overrides = {}) {
  const body = {
    parentName: 'Christy Zemour',
    signatureName: 'Christy Zemour',
    esignConsent: true,
    email: 'parent@example.com',
    phone: '954-555-0100',
    babyName: 'Lily',
    babyDob: '2026-09-01',
    bath: 'floral-milk-soak',
    creme: 'signature',
    confirmReady: ['age', 'price', 'join', 'checkin', 'contact', 'deposit'],
    ...overrides,
  };
  if (!Object.hasOwn(overrides, 'confirmReady') && body.bath === 'byob') body.confirmReady = [...body.confirmReady, 'byob'];
  return body;
}

function signature(overrides = {}) {
  return {
    signatureName: 'Someone Else',
    email: 'parent@example.com',
    relationship: 'mother',
    adult18: true,
    esignConsent: true,
    part: 'parent',
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

test('worker session price stays locked to the booking price', () => {
  assert.equal(PRICES.session.amount, SESSION_PRICE_CENTS);
  assert.equal(PRICES.session.taxable, false);
});

test('price table ignores tampered client prices and keeps taxes off', async () => {
  assert.equal(TAX_ENABLED, false);
  assert.equal(TAX_RATE, 0.07);
  assert.equal(taxesEnabled(), false);
  assert.equal(taxesEnabled({TAX_ENABLED: 'false'}), false);
  assert.equal(taxesEnabled({TAX_ENABLED: 'true'}), true);
  assert.deepEqual(PRICES.session, {amount: SESSION_PRICE_CENTS, taxable: false});
  assert.deepEqual(PRICES.creme, {
    signature: {amount: 0, taxable: false},
    gentle: {amount: 500, taxable: true},
    premium: {amount: 1000, taxable: true},
  });
  assert.deepEqual(PRICES.bath['floral-milk-soak'], {amount: 0, taxable: false});
  assert.deepEqual(PRICES.bath.byob, {amount: 0, taxable: false});
  assert.deepEqual(PRICES.petals, {amount: 0, taxable: false});
  assert.deepEqual(PRICES.robe, {amount: null, taxable: true});
  assert.deepEqual(PRICES.bathBag, {amount: 1800, taxable: true});
  assert.deepEqual(PRICES.secondAdult, {amount: 2500, taxable: false});
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
  assert.deepEqual(order.lines.map(line => [line.name, line.variation_name, line.base_price_money.amount]), [
    [sessionLine, 'BYOB (Bring your own breastmilk) + rose petals', SESSION_PRICE_CENTS],
    ['Premium face crème', undefined, 1000],
  ]);
  assert.equal(order.total, SESSION_PRICE_CENTS + 1000);
  assert.match(order.note, /BYOB/);
  assert.match(order.note, /rose petals: yes/);
  assert.equal(order.lines.some(line => line.base_price_money.amount === 1), false);

  const signature = buildOrder(validateBooking(form(), {session, now: openNow}).booking, PRICES, session);
  assert.equal(signature.total, SESSION_PRICE_CENTS);
  assert.equal(signature.lines.length, 1);
  assert.equal(signature.lines[0].name, sessionLine);
  assert.equal(signature.lines[0].variation_name, 'Floral Milk Soak');
  assert.match(signature.note, /Crème: Signature/);
  const byob = buildOrder(validateBooking(form({bath: 'byob', petals: 'no'}), {session, now: openNow}).booking, PRICES, session);
  assert.equal(byob.lines[0].variation_name, 'BYOB (Bring your own breastmilk)');

  const gentle = buildOrder(validateBooking(form({creme: 'gentle', faceCream: 'gentle'}), {session, now: openNow}).booking, PRICES, session);
  assert.equal(gentle.total, SESSION_PRICE_CENTS + 500);
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
  assert.equal(captured.body.order.taxes, undefined);
  assert.equal(captured.body.order.line_items.every(line => line.applied_taxes == null), true);
  assert.equal(JSON.stringify(captured.body).toLowerCase().includes('processing fee'), false);
  assert.equal(JSON.stringify(captured.body).toLowerCase().includes('surcharge'), false);
  assert.equal(captured.body.pre_populated_data.buyer_email, 'parent@example.com');
  assert.equal(captured.body.checkout_options.redirect_url, 'https://lysrosebabyspa.com/book/thank-you/');
  assert.equal(captured.body.checkout_options.enable_coupon, false);
  assert.equal(captured.body.order.line_items[0].name, sessionLine);
  assert.equal(captured.body.order.line_items[0].variation_name, 'BYOB (Bring your own breastmilk) + rose petals');
  assert.equal(captured.body.order.line_items[0].base_price_money.amount, SESSION_PRICE_CENTS);
  assert.equal(captured.body.order.line_items[1].name, 'Premium face crème');
  assert.equal(captured.body.order.line_items[1].variation_name, undefined);
  assert.equal(captured.body.order.line_items[1].base_price_money.amount, 1000);
  assert.equal(captured.body.order.location_id, 'LOC123');
  assert.match(captured.authorization, /^Bearer /);
  assert.deepEqual(captured.body.order.line_items.map(line => line.base_price_money.amount), [SESSION_PRICE_CENTS, 1000]);
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
  const young = validateBooking(form({babyDob: '2026-11-09'}), {session, now: new Date(2026, 9, 29)});
  assert.equal(young.ok, false);
  assert.match(young.errors.babyDob, /4 weeks/);
  const oldEnoughOnSession = validateBooking(form({babyDob: '2026-11-08'}), {session, now: new Date(2026, 10, 1)});
  assert.equal(oldEnoughOnSession.ok, true);
  const tooOld = validateBooking(form({babyDob: '2025-12-05'}), {session, now: openNow});
  assert.equal(tooOld.ok, false);
  assert.match(tooOld.errors.babyDob, /12 months/);
  const birthday = validateBooking(form({babyDob: '2025-12-06'}), {session, now: openNow});
  assert.equal(birthday.ok, true);
  const robePrices = {
    ...PRICES,
    robe: {amount: 4500, taxable: true},
    bathBag: {amount: 1800, taxable: true},
    secondAdult: {amount: 4000, taxable: false},
  };
  const robeClosed = validateBooking(form({robe: true, robeName: 'Lily'}), {session, now: new Date('2026-11-23T05:00:00Z'), prices: robePrices});
  assert.equal(robeClosed.ok, false);
  assert.match(robeClosed.errors.robe, /closed/);
  const hidden = validateBooking(form({robe: true, bathBag: true, secondAdult: true}), {session, now: openNow});
  assert.equal(hidden.ok, false);
  assert.match(hidden.errors.robe, /isn't available/);
  assert.equal(hidden.errors.bathBag, undefined);
  assert.equal(hidden.errors.secondAdult, undefined);
  const adultOnly = validateBooking(form({secondAdult: true, secondAdultName: 'Jordan Lee', secondAdultEmail: 'jordan@example.com'}), {session, now: openNow});
  assert.equal(adultOnly.ok, true);
  const adultLine = buildOrder(adultOnly.booking, PRICES, session).lines.find(line => line.name === 'Second adult');
  assert.equal(adultLine.base_price_money.amount, 2500);
  assert.equal(adultLine.taxable, false);
  const bagOnly = validateBooking(form({bathBag: true}), {session, now: openNow});
  assert.equal(bagOnly.ok, true);
  const bagLine = buildOrder(bagOnly.booking, PRICES, session).lines.find(line => line.name === 'Floral Milk Bath Bag');
  assert.equal(bagLine.base_price_money.amount, 1800);
  assert.equal(bagLine.taxable, true);
  const openRobe = validateBooking(form({robe: true, robeName: 'Lily', bathBag: true, secondAdult: true, secondAdultName: 'Jordan Lee', secondAdultEmail: 'jordan@example.com'}), {session, now: openNow, prices: robePrices});
  assert.equal(openRobe.ok, true);
  const priced = buildOrder(openRobe.booking, robePrices, session);
  assert.equal(priced.total, SESSION_PRICE_CENTS + 4500 + 1800 + 4000);
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
    total: SESSION_PRICE_CENTS,
    booking: {babyName: 'Lily', email: 'parent@example.com', babyDob: '2026-09-01', ageMonthsAtSession: 3, booking_id: 'book-1', acknowledgements: {age: {answer: 'yes', at: '2026-11-01T00:00:00.000Z'}}},
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
  assert.equal(booking.babyDob, '2026-09-01');
  assert.equal(booking.ageMonthsAtSession, 3);
  assert.equal(booking.acknowledgements.age.answer, 'yes');
  assert.equal(booking.acknowledgements.age.at, '2026-11-01T00:00:00.000Z');
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

test('tax at 7% is added only to taxable lines, and only when enabled', async () => {
  const prices = {
    ...PRICES,
    robe: {amount: 4500, taxable: true},
    bathBag: {amount: 1800, taxable: true},
    secondAdult: {amount: 4000, taxable: false},
  };
  const booking = validateBooking(form({
    creme: 'gentle',
    robe: true,
    bathBag: true,
    secondAdult: true,
    secondAdultName: 'Jordan Lee',
    secondAdultEmail: 'jordan@example.com',
    total: 1,
    price: 1,
  }), {session, now: openNow, prices});
  assert.equal(booking.ok, true);
  const order = buildOrder(booking.booking, prices, session);
  const taxable = 500 + 4500 + 1800;
  assert.equal(salesTaxCents(order.lines), Math.round((taxable * 7) / 100));
  assert.equal(salesTaxCents(order.lines), 476);
  assert.deepEqual(order.lines.map(line => [line.name, line.base_price_money.amount, line.taxable]), [
    [sessionLine, SESSION_PRICE_CENTS, false],
    ['Gentle face crème', 500, true],
    ['Embroidered keepsake robe', 4500, true],
    ['Floral Milk Bath Bag', 1800, true],
    ['Second adult', 4000, false],
  ]);
  const taxed = squareOrderPayload(order, {TAX_ENABLED: 'true', SQUARE_LOCATION_ID: 'LOC123'});
  assert.equal(taxed.pricing_options.auto_apply_taxes, false);
  assert.deepEqual(taxed.taxes, [{uid: 'sales-tax', name: 'Sales tax', type: 'ADDITIVE', percentage: '7.0', scope: 'LINE_ITEM'}]);
  assert.deepEqual(taxed.line_items.filter(line => line.applied_taxes).map(line => line.name), [
    'Gentle face crème',
    'Embroidered keepsake robe',
    'Floral Milk Bath Bag',
  ]);
  assert.equal(taxed.line_items.find(line => line.name === sessionLine).applied_taxes, undefined);
  assert.equal(taxed.line_items.find(line => line.name === sessionLine).variation_name, 'Floral Milk Soak');
  assert.equal(taxed.line_items.find(line => line.name === 'Second adult').applied_taxes, undefined);
  assert.equal(JSON.stringify(taxed).toLowerCase().includes('processing fee'), false);
  const untaxed = squareOrderPayload(order, {TAX_ENABLED: 'false'});
  assert.equal(untaxed.taxes, undefined);
  assert.equal(untaxed.line_items.every(line => line.applied_taxes == null), true);
  assert.equal(salesTaxCents(buildOrder(validateBooking(form(), {session, now: openNow}).booking).lines), 0);

  let captured;
  const response = await handleCheckoutRequest(checkoutRequest(form({creme: 'premium', amount: 50})), {...env(), TAX_ENABLED: 'true'}, async (_url, init) => {
    captured = JSON.parse(init.body);
    return new Response(JSON.stringify({payment_link: {url: 'https://sandbox.square.link/u/preview', order_id: 'ord_tax'}}), {status: 200});
  }, openNow, session);
  assert.equal(response.status, 200);
  assert.equal(captured.order.taxes[0].percentage, '7.0');
  assert.deepEqual(captured.order.line_items.map(line => [line.name, line.base_price_money.amount, Boolean(line.applied_taxes)]), [
    [sessionLine, SESSION_PRICE_CENTS, false],
    ['Premium face crème', 1000, true],
  ]);
  assert.equal(captured.checkout_options.enable_coupon, false);
  assert.equal(salesTaxCents([{taxable: false, base_price_money: {amount: SESSION_PRICE_CENTS}}, {taxable: true, base_price_money: {amount: 1000}}]), 70);
  assert.equal(captured.order.line_items.some(line => /fee|surcharge/i.test(line.name)), false);
});

test('catalog plan prices the session variations together and skips null extras', () => {
  const plan = catalogPlan();
  assert.equal(plan.taxes, 'off');
  assert.equal(plan.rate, 0.07);
  const sessionItem = plan.items[0];
  assert.equal(sessionItem.name, 'Lys Rose Session');
  assert.equal(sessionItem.taxable, false);
  assert.deepEqual(sessionItem.variations.map(item => item.amount), [SESSION_PRICE_CENTS, SESSION_PRICE_CENTS]);
  assert.deepEqual(sessionItem.variations.map(item => item.taxable), [false, false]);
  assert.deepEqual(sessionItem.variations.map(item => item.name), ['Floral Milk Soak', 'BYOB']);
  const flags = Object.fromEntries(plan.items.filter(item => !item.variations).map(item => [item.name, item.taxable]));
  assert.deepEqual(flags, {
    'Signature face crème': false,
    'Gentle face crème': true,
    'Premium face crème': true,
    'Embroidered keepsake robe': true,
    'Floral Milk Bath Bag': true,
    'Complimentary rose petals': false,
    'Second adult': false,
  });
  const objects = catalogUpsertObjects();
  assert.equal(objects.some(item => item.item_data.name === 'Embroidered keepsake robe'), false);
  const secondAdultItem = objects.find(item => item.item_data.name === 'Second adult');
  assert.equal(secondAdultItem.item_data.is_taxable, false);
  assert.equal(secondAdultItem.item_data.variations[0].item_variation_data.price_money.amount, 2500);
  const bathBagItem = objects.find(item => item.item_data.name === 'Floral Milk Bath Bag');
  assert.equal(bathBagItem.item_data.is_taxable, true);
  assert.equal(bathBagItem.item_data.variations[0].item_variation_data.price_money.amount, 1800);
  const sessionObject = objects.find(item => item.id === '#lys-rose-session');
  assert.equal(sessionObject.item_data.is_taxable, false);
  assert.equal(sessionObject.item_data.variations[0].item_variation_data.price_money.amount, SESSION_PRICE_CENTS);
  assert.equal(objects.find(item => item.item_data.name === 'Gentle face crème').item_data.is_taxable, true);
  assert.equal(objects.find(item => item.item_data.name === 'Signature face crème').item_data.is_taxable, false);
  assert.equal(objects.find(item => item.item_data.name === 'Premium face crème').item_data.is_taxable, true);
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
  const printed = JSON.parse(dry.stdout.slice(0, dry.stdout.indexOf('\nDry run')));
  const flags = Object.fromEntries(printed.items.map(item => [item.name, item.taxable]));
  assert.equal(flags['Lys Rose Session'], false);
  assert.equal(flags['Signature face crème'], false);
  assert.equal(flags['Gentle face crème'], true);
  assert.equal(flags['Premium face crème'], true);
  assert.equal(flags['Embroidered keepsake robe'], true);
  assert.equal(flags['Floral Milk Bath Bag'], true);
  assert.equal(printed.items.find(item => item.name === 'Floral Milk Bath Bag').amount, 1800);
  assert.equal(printed.items.find(item => item.name === 'Floral Milk Bath Bag').create, true);
  assert.equal(flags['Complimentary rose petals'], false);
  assert.equal(flags['Second adult'], false);
  assert.equal(printed.items.find(item => item.name === 'Second adult').amount, 2500);
  assert.equal(printed.items.find(item => item.name === 'Second adult').create, true);
  assert.deepEqual(printed.items[0].variations.map(item => item.taxable), [false, false]);
  assert.match(dry.stdout, /No Square request was sent/);
  const apply = spawnSync(process.execPath, ['scripts/square-catalog.mjs', '--apply'], {encoding: 'utf8', env: {...process.env, SQUARE_ACCESS_TOKEN: '', SQUARE_LOCATION_ID: '', SQUARE_ENV: 'sandbox', CONFIRM_PRODUCTION: ''}});
  assert.notEqual(apply.status, 0);
  assert.match(apply.stderr, /No Square request was sent/);
  const production = spawnSync(process.execPath, ['scripts/square-catalog.mjs', '--apply'], {encoding: 'utf8', env: {...process.env, SQUARE_ENV: 'production', SQUARE_ACCESS_TOKEN: 'not-a-real-token', SQUARE_LOCATION_ID: 'LOC', CONFIRM_PRODUCTION: ''}});
  assert.equal(production.status, 1);
  assert.match(production.stderr, /Refusing to write to production without CONFIRM_PRODUCTION=yes\. No Square request was sent\./);
});

test('idempotency key separates different bookings and repeats for a double submit', async () => {
  const keys = [];
  const fetchImpl = async (_url, init) => {
    keys.push(JSON.parse(init.body).idempotency_key);
    return new Response(JSON.stringify({payment_link: {url: 'https://sandbox.square.link/u/x', order_id: `ord_${keys.length}`}}), {status: 200});
  };
  const send = body => handleCheckoutRequest(checkoutRequest(body), env(), fetchImpl, openNow, session);
  const base = form({bath: 'byob', petals: 'yes', creme: 'premium', email: 'a-very-long-parent-address@lysrosebabyspa.com'});
  await send(base);
  await send(base);
  await send({...base, petals: 'no'});
  await send({...base, babyName: 'Twin', babyDob: '2026-09-20'});
  assert.equal(keys[0], keys[1]);
  assert.equal(new Set(keys).size, 3);
});

test('a stored order is not replaced by a different booking', async () => {
  const store = memoryStore();
  const fetchImpl = async () => new Response(JSON.stringify({payment_link: {url: 'https://sandbox.square.link/u/x', order_id: 'ord_same'}}), {status: 200});
  const first = await handleCheckoutRequest(checkoutRequest(form({babyName: 'Lily'})), env(store), fetchImpl, openNow, session);
  assert.equal(first.status, 200);
  const second = await handleCheckoutRequest(checkoutRequest(form({babyName: 'Twin', babyDob: '2026-09-20'})), env(store), fetchImpl, openNow, session);
  assert.equal(second.status, 409);
  assert.equal(JSON.parse(await store.get('order:ord_same')).booking.babyName, 'Lily');
  const repeat = await handleCheckoutRequest(checkoutRequest(form({babyName: 'Lily'})), env(store), fetchImpl, openNow, session);
  assert.equal(repeat.status, 200);
  assert.equal(JSON.parse(await store.get('order:ord_same')).booking.babyName, 'Lily');
});

test('birth date and health acknowledgements are required, recorded, and kept', async () => {
  const source = await readFile(new URL('../worker/src/checkout.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('expirationTtl'), false);
  const noHealth = validateBooking(form({confirmReady: ['age', 'price', 'deposit']}), {session, now: openNow});
  assert.equal(noHealth.ok, false);
  assert.match(noHealth.errors.confirmReady, /confirm/);
  const needsByob = validateBooking(form({bath: 'byob', confirmReady: ['age', 'price', 'join', 'checkin', 'contact', 'deposit']}), {session, now: openNow});
  assert.equal(needsByob.ok, false);
  const checked = validateBooking(form(), {session, now: openNow});
  assert.equal(checked.ok, true);
  assert.equal(checked.booking.babyDob, '2026-09-01');
  assert.equal(checked.booking.ageMonthsAtSession, 3);
  for (const key of ['age', 'price', 'join', 'checkin', 'contact', 'deposit']) {
    assert.equal(checked.booking.acknowledgements[key].answer, 'yes', key);
    assert.equal(checked.booking.acknowledgements[key].at, openNow.toISOString(), key);
  }
  const order = buildOrder(checked.booking, PRICES, session);
  assert.match(order.note, /Baby date of birth: 2026-09-01/);
  const payload = squareOrderPayload(order);
  assert.equal(payload.metadata.baby_date_of_birth, '2026-09-01');
  const store = memoryStore();
  let captured;
  const response = await handleCheckoutRequest(checkoutRequest(form()), env(store), async (_url, init) => {
    captured = JSON.parse(init.body);
    return new Response(JSON.stringify({payment_link: {url: 'https://sandbox.square.link/u/preview', order_id: 'ord_dob'}}), {status: 200});
  }, openNow, session);
  assert.equal(response.status, 200);
  assert.equal(captured.payment_note.includes('Baby date of birth: 2026-09-01'), true);
  assert.equal(captured.order.metadata.baby_date_of_birth, '2026-09-01');
  const saved = JSON.parse(await store.get('order:ord_dob'));
  assert.equal(saved.booking.babyDob, '2026-09-01');
  assert.equal(saved.booking.ageMonthsAtSession, 3);
  assert.equal(saved.booking.acknowledgements.join.answer, 'yes');
  assert.equal(saved.booking.acknowledgements.join.at, openNow.toISOString());
  assert.equal(saved.booking.acknowledgements.deposit.at, openNow.toISOString());
});

test('a signed waiver is stored with its hash, IP and user agent, and is not rewritten', async () => {
  const missingAdult = validateBooking(form({secondAdult: true, secondAdultName: '', secondAdultEmail: ''}), {session, now: openNow});
  assert.equal(missingAdult.ok, false);
  assert.match(missingAdult.errors.secondAdultName, /name/);
  assert.match(missingAdult.errors.secondAdultEmail, /email/);
  const store = memoryStore();
  const request = new Request('https://forms.lysrosebabyspa.com/api/checkout', {
    method: 'POST',
    headers: {Origin: 'https://lysrosebabyspa.com', 'Content-Type': 'application/json', 'user-agent': 'LysRoseTest/1.0', 'cf-connecting-ip': '203.0.113.8'},
    body: JSON.stringify(form()),
  });
  let captured;
  const response = await handleCheckoutRequest(request, env(store), async (_url, init) => {
    captured = JSON.parse(init.body);
    return new Response(JSON.stringify({payment_link: {url: 'https://sandbox.square.link/u/preview', order_id: 'ord_sign'}}), {status: 200});
  }, openNow, session);
  assert.equal(response.status, 200);
  assert.equal(captured.order.metadata.signature_name, undefined);
  assert.equal(captured.order.metadata.waiver_status, 'primary:pending');
  const saved = JSON.parse(await store.get('order:ord_sign'));
  const bookingId = saved.booking.booking_id;
  const record = JSON.parse(await store.get(`booking-record:${bookingId}`));
  assert.deepEqual(record.waiver_status, [{role: 'primary', part: 'parent', name: 'Christy Zemour', email: 'parent@example.com', status: 'pending'}]);
  assert.equal(await store.get(`waiver:${bookingId}`), null);
  const link = await waiverLink(store, bookingId, 'primary', 'parent@example.com', 'Christy Zemour');
  const token = new URL(link).searchParams.get('token');
  const unsigned = await signWaiverRequest(store, token, {signatureName: '', esignConsent: false, adult18: false}, openNow, 'LysRoseTest/1.0', '203.0.113.8');
  assert.equal(unsigned.ok, false);
  const shown = signedDocumentText({
    part: 'parent',
    babyName: 'Lily',
    babyDob: '2026-09-01',
    sessionDate: sessionDateLabel(session),
    sessionTime: sessionTimeLabel(session),
    location: 'Fort Lauderdale',
    bookingId,
    byob: false,
  });
  const signed = await signWaiverRequest(store, token, signature(), openNow, 'LysRoseTest/1.0', '203.0.113.8');
  assert.equal(signed.ok, true);
  assert.equal(signed.parent_cleared, true);
  assert.equal(signed.can_add, true);
  assert.equal(signed.limit, 1);
  const key = `waiver:${bookingId}:parent:parent@example.com`;
  const waiver = JSON.parse(await store.get(key));
  assert.equal(waiver.role, 'primary');
  assert.equal(waiver.part, 'parent');
  assert.equal(waiver.relationship, 'mother');
  assert.equal(waiver.signature_name, 'Someone Else');
  assert.equal(waiver.signed_at, openNow.toISOString());
  assert.equal(waiver.terms_version, 'booking-waiver-esignature-draft-2026-11-04');
  assert.equal(waiver.user_agent, 'LysRoseTest/1.0');
  assert.equal(waiver.ip_address, '203.0.113.8');
  assert.equal(waiver.babyName, 'Lily');
  assert.equal(waiver.babyDob, '2026-09-01');
  assert.equal(waiver.retention, 'attorney to set');
  assert.equal(waiver.esign_consent.answer, 'yes');
  assert.equal(waiver.adult18.answer, 'yes');
  assert.equal(waiver.signed_text, shown);
  assert.equal(waiver.signed_text.includes('Bring your own breastmilk.'), false);
  assert.match(waiver.text_sha256, /^[0-9a-f]{64}$/);
  assert.equal(waiver.text_sha256, await sha256Hex(shown));
  const again = await signWaiverRequest(store, token, signature({signatureName: 'Changed'}), openNow, 'other', '1.2.3.4');
  assert.equal(again.already, true);
  const kept = JSON.parse(await store.get(key));
  assert.equal(kept.signature_name, 'Someone Else');
  const added = await addWaiverAdult(store, token, 'Jordan Lee', 'jordan@example.com');
  assert.equal(added.ok, true);
  assert.equal(added.can_add, false);
  const blocked = await addWaiverAdult(store, token, 'Aunt May', 'may@example.com');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 409);
  const secondLink = await waiverLink(store, bookingId, 'additional_adult', 'jordan@example.com', 'Jordan Lee');
  const secondToken = new URL(secondLink).searchParams.get('token');
  const secondSigned = await signWaiverRequest(store, secondToken, signature({
    signatureName: 'Jordan Lee',
    email: 'jordan@example.com',
    relationship: 'grandparent',
    part: 'additional',
  }), openNow, 'LysRoseTest/1.0', '203.0.113.9');
  assert.equal(secondSigned.ok, true);
  assert.equal(secondSigned.can_add, false);
  const secondRecord = JSON.parse(await store.get(`waiver:${bookingId}:additional:jordan@example.com`));
  assert.equal(secondRecord.role, 'additional_adult');
  assert.equal(secondRecord.part, 'additional');
  assert.equal(secondRecord.signature_name, 'Jordan Lee');
  assert.equal(secondRecord.signed_text.includes('Additional adult.'), true);
});

test('a booking that already has a second adult does not offer another', async () => {
  const store = memoryStore();
  const response = await handleCheckoutRequest(checkoutRequest(form({
    secondAdult: true,
    secondAdultName: 'Jordan Lee',
    secondAdultEmail: 'jordan@example.com',
  })), env(store), async () => new Response(JSON.stringify({payment_link: {url: 'https://sandbox.square.link/u/preview', order_id: 'ord_two'}}), {status: 200}), openNow, session);
  assert.equal(response.status, 200);
  const saved = JSON.parse(await store.get('order:ord_two'));
  const bookingId = saved.booking.booking_id;
  assert.equal(saved.booking.waiver_status[1].role, 'second_adult');
  assert.equal(saved.booking.waiver_status[1].part, 'additional');
  const link = await waiverLink(store, bookingId, 'primary', 'parent@example.com', 'Christy Zemour');
  const token = new URL(link).searchParams.get('token');
  const signed = await signWaiverRequest(store, token, signature({signatureName: 'Christy Zemour'}), openNow, 'LysRoseTest/1.0', '203.0.113.8');
  assert.equal(signed.can_add, false);
  assert.equal(signed.parent_cleared, true);
  const blocked = await addWaiverAdult(store, token, 'Aunt May', 'may@example.com');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 409);
});

test('retries once when Square rejects the buyer email', async () => {
  const bodies = [];
  const fetchImpl = async (_url, init) => {
    const body = JSON.parse(init.body);
    bodies.push(body);
    if (bodies.length === 1) return new Response(JSON.stringify({errors: [{code: 'INVALID_EMAIL_ADDRESS'}]}), {status: 400});
    return new Response(JSON.stringify({payment_link: {url: 'https://sandbox.square.link/u/x', order_id: 'ord_email'}}), {status: 200});
  };
  const response = await handleCheckoutRequest(checkoutRequest(form()), env(), fetchImpl, openNow, session);
  assert.equal(response.status, 200);
  assert.equal(bodies[0].pre_populated_data.buyer_email, 'parent@example.com');
  assert.equal(bodies[1].pre_populated_data, undefined);
  assert.notEqual(bodies[0].idempotency_key, bodies[1].idempotency_key);
  const once = [];
  const other = await handleCheckoutRequest(checkoutRequest(form()), env(), async (_url, init) => {
    once.push(JSON.parse(init.body));
    return new Response(JSON.stringify({errors: [{code: 'BAD_REQUEST'}]}), {status: 400});
  }, openNow, session);
  assert.equal(other.status, 502);
  assert.equal(once.length, 1);
});

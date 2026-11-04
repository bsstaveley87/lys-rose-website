import {catalogPlan, catalogUpsertObjects, squareApiHost, TAX_ENABLED, SQUARE_VERSION} from '../worker/src/checkout.ts';

const apply = process.argv.includes('--apply');
const envName = process.env.SQUARE_ENV === 'production' ? 'production' : 'sandbox';
const plan = catalogPlan();
console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  tax: {enabled: TAX_ENABLED, rate: '7%', note: 'A tax line is sent only when enabled, and only for items marked taxable. No processing fee is added.'},
  host: squareApiHost(envName),
  note: 'Prices come from the worker price table. A null amount is not created. Each item includes its taxable flag. No card data is involved.',
  items: plan.items,
}, null, 2));

if (!apply) {
  console.log('Dry run only. No Square request was sent. Re-run with --apply after SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID are set.');
  process.exit(0);
}

const token = process.env.SQUARE_ACCESS_TOKEN || '';
const locationId = process.env.SQUARE_LOCATION_ID || '';
if (!token || !locationId) {
  console.error('Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID. No Square request was sent.');
  process.exit(1);
}

const objects = catalogUpsertObjects();
const response = await fetch(`${squareApiHost(envName)}/v2/catalog/batch-upsert`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Square-Version': SQUARE_VERSION,
  },
  body: JSON.stringify({
    idempotency_key: crypto.randomUUID(),
    batches: [{objects}],
  }),
});

if (!response.ok) {
  console.error(`Catalog request failed (${response.status}). No secret values were printed.`);
  process.exit(1);
}
console.log(`Created ${objects.length} catalog items at location ${locationId}.`);

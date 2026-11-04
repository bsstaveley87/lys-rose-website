# Lys Rose Baby Spa

Website: https://lysrosebabyspa.com. GitHub Pages serves the site; Cloudflare supplies public HTTPS, redirects and the waitlist endpoint.

## Build and validate

Requires Node.js 24, as pinned in `.nvmrc` and used in GitHub Actions. Node 20 cannot import the worker TypeScript. The package accepts Node 22.18 or newer. Run:

```
npm ci
npm run build
npm test
python3 -m http.server 4174 --directory _site
```

GitHub Actions runs a clean install, build and tests before deploying `_site/`. Source pages contain body content; the homepage supplies the shared header, menu and footer for every page; `site.config.mjs` and `scripts/build.mjs` generate metadata, schema, sitemap, robots and versioned assets. `assets/reference.css` holds named components adapted from the supplied Option B HTML; `assets/site.css` owns responsive layouts and interaction states. Edit these source files, never `_site/`.

## Browser audits

`npm run audit:prepare` builds the site and installs local-only read-only audit harnesses into `_site/__audit__/`. Serve `_site` and open `/__audit__/` for five pages at five screen sizes, or `/__audit__/accessibility.html` for axe-core checks at mobile and desktop widths. A normal build excludes all audit tools. These checks run in the browser; they are not a Lighthouse score or a substitute for real-device and assistive-technology testing. See `AUDIT.md` for scope and findings.

## Waitlist

The browser and Worker share `assets/validation.js`. Required name/email and optional phone, ZIP, age and area are checked consistently. Invalid fields receive inline errors, an error summary and focus. Loading, rate limit, provider and network errors preserve entered values. JavaScript-free form POSTs receive an HTML confirmation or error page.

The Worker posts to the restricted, verified destination hello@lysrosebabyspa.com through Cloudflare Email Routing. Replies go to the submitter. It applies an origin allowlist, a honeypot, bounded input and a three-per-minute IP rate limiter. Success appears only after the email provider accepts the message. Delivery to the final inbox still depends on mail servers. The inbox is the signup record; there is no separate signup database or automated marketing system.

Every email records its server timestamp and `smsConsent: false`. SMS is disabled and allergies are not collected. A future newsletter platform must manage subscriptions and unsubscribe requests.

Worker changes require a separate deployment:

```
cd worker
npm ci
npm run check
cf deploy --dry-run
cf deploy
```

The project uses `cloudflare.config.ts` and the cf CLI. Google Workspace root MX/SPF/DKIM records are retained. Cloudflare Email Routing uses the forms subdomain. The existing Full TLS setting encrypts the origin connection; GitHub must finish its origin certificate before switching to Full (strict). Cloudflare's public certificate is independent.

## Checkout preview

Hosted checkout is drafted on this branch and is not deployed. The worker does not call Square unless `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` are set in the environment. Do not commit those values. Card numbers never reach this site: `POST /api/checkout` validates the booking and asks Square for a payment link. The buyer finishes on Square's page and returns to `/book/thank-you/`.

While `SESSION` in `assets/booking.js` is null, or `CHECKOUT_CONFIGURED` is false, the pay button stays disabled and the page keeps the preview sentence. Prices are taken only from `PRICES` in `worker/src/checkout.ts`. A null add-on price hides that extra. `TAX_ENABLED` stays `false` until the Florida registration is finished and the CFO says to turn taxes on. There is no surcharge and no processing fee. When tax is turned on, one Sales tax line at 7% (Florida 6% plus the Broward 1% surtax) is added only to taxable lines: crème upgrades, the robe, and the Floral Milk Bath Bag. The session, Signature crème, the bath choice, rose petals, and the second adult are not taxed.

Set these in the Cloudflare worker environment, never in git:

| Name | Binding | Purpose |
| --- | --- | --- |
| `SQUARE_ACCESS_TOKEN` | secret | Square API token. Sandbox until go-live. |
| `SQUARE_LOCATION_ID` | secret | Location id for LYS ROSE LLC. |
| `SQUARE_ENV` | text, default `sandbox` | `sandbox` or `production`. Anything else uses sandbox. |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | secret | Signature key from the Square webhook subscription. |
| `TAX_ENABLED` | text, default `false` | `true` adds a 7% sales-tax line on taxable lines only. `auto_apply_taxes` stays false. Leave `false` for now. |
| `BOOKINGS` | KV | Pending orders, confirmed bookings, and seat counts. Create the namespace and set its id in `worker/cloudflare.config.ts` before any deploy. |

`POST /api/square-webhook` checks Square's HMAC-SHA256 signature over the notification URL plus the raw body. Seats are counted only after `payment.updated` or `payment.created` with status `COMPLETED`. The payment link itself is not expired through the API. The order record stores the 48-hour cutoff, and the webhook compares `payment.created_at` with that cutoff. A late payment, a session that is already at the seat cap, or a payment with no matching order is stored as `refund-flagged` and does not take a seat. This preview does not call Square's refund API; someone refunds those payments in the Square dashboard. The seat cap is not written into any page.

`scripts/square-catalog.mjs` prints the catalog it would create and does not call Square. `--apply` creates the items only when both credentials are present. It refuses `SQUARE_ENV=production` unless `CONFIRM_PRODUCTION=yes`. Robe, bath bag, and second adult are listed and skipped while their prices are null. The redirect URL is `https://lysrosebabyspa.com/book/thank-you/`. Do not run `cf deploy` for this preview.

## Go-live checklist

- Create a Square webhook subscription for `https://forms.lysrosebabyspa.com/api/square-webhook` on `payment.created` and `payment.updated`, and put its signature key in `SQUARE_WEBHOOK_SIGNATURE_KEY`. The URL must match exactly.
- Create a real `BOOKINGS` KV namespace and set its id in `worker/cloudflare.config.ts`.
- Set the production `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID`, with `SQUARE_ENV=production`.
- Leave `TAX_ENABLED` false until the Florida registration is approved.
- Set the robe, bath bag, and second-adult prices.
- Set `SESSION` and `CHECKOUT_CONFIGURED`.
- Check the CORS origins in `worker/src/checkout.ts` (`lysrosebabyspa.com`, `www.lysrosebabyspa.com`, and `bsstaveley87.github.io`).
- Refunds are handled manually in the Square dashboard.

## Visual assets and content

The supplied root-folder AI concept photos are `baby_spa_bath_hero_standalone.png`, `Cozy Baby Spa Feet and Rose Petals.png`, `baby_spa_product_pouch_standalone.png` and `Cozy Baby Spa Retreat.png`. Responsive WebP versions preserve source proportions in the detail row. Mobile separates the full bath photo from text; desktop uses an image background with a high-contrast gradient. No generated portrait is presented as the founder's daughter. Replace concept photos with real photographs when available.

The founder/session copy and footer disclaimer remain as supplied. Titles and descriptions are managed centrally. Structured data uses visible facts and FAQ answers; it adds no fabricated address, venue, price, rating or availability. The source creative and business/legal documents remain outside the repository.

# Lys Rose Baby Spa

Website: https://lysrosebabyspa.com. GitHub Pages serves the site; Cloudflare supplies public HTTPS, redirects and the waitlist endpoint.

## Build and validate

Requires Node.js 24 or newer for the site checks. Run:

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

Worker changes require a separate deployment. The careers form posts to `POST /apply` on the same Worker and is not live until this deploy succeeds. `cf auth whoami` must show a logged-in account for `b69bc99a43e009e66f5d9da71bcfbb5e` before you deploy:

```
cd worker
npm ci
npm run check
cf deploy --dry-run
cf deploy
```

The project uses `cloudflare.config.ts` and the cf CLI. Google Workspace root MX/SPF/DKIM records are retained. Cloudflare Email Routing uses the forms subdomain. The existing Full TLS setting encrypts the origin connection; GitHub must finish its origin certificate before switching to Full (strict). Cloudflare's public certificate is independent.

## Visual assets and content

The supplied root-folder AI concept photos are `baby_spa_bath_hero_standalone.png`, `Cozy Baby Spa Feet and Rose Petals.png`, `baby_spa_product_pouch_standalone.png` and `Cozy Baby Spa Retreat.png`. Responsive WebP versions preserve source proportions in the detail row. Mobile separates the full bath photo from text; desktop uses an image background with a high-contrast gradient. No generated portrait is presented as the founder's daughter. Replace concept photos with real photographs when available.

The founder/session copy and footer disclaimer remain as supplied. Titles and descriptions are managed centrally. Structured data uses visible facts and FAQ answers; it adds no fabricated address, venue, price, rating or availability. The source creative and business/legal documents remain outside the repository.

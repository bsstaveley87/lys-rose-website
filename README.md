# Lys Rose Baby Spa

Static website hosted on GitHub Pages at https://lysrosebabyspa.com, with Cloudflare proxy HTTPS and a Cloudflare Worker for waitlist email delivery.

Cloudflare redirects HTTP to HTTPS and www to the apex domain. The root and www web DNS records are proxied; email records are separate. The existing Cloudflare Full TLS setting encrypts the origin connection. GitHub’s separate origin certificate can finish provisioning independently; public TLS is handled by Cloudflare.

## Site

Home, About, Services, FAQ and Contact share a stylesheet and progressive JavaScript. The homepage uses the supplied Option B layout and Oct 21 copy. Hero zoom, scroll parallax, staggered entrances, section reveals, animated menu and disclosure controls respect reduced motion preferences. Content and links remain available without animation.

Run `npm run build` to create `_site/`. GitHub Actions publishes only that directory; worker source, tests and internal notes are not part of the deployed site. Edit HTML and assets directly. To preview, run `python3 -m http.server 4173 --directory _site` after building.

## Waitlist

The browser posts to https://forms.lysrosebabyspa.com/waitlist. The Cloudflare Worker validates every field, restricts browser origins, limits requests per IP, checks a honeypot, and sends to the verified hello@lysrosebabyspa.com destination. Replies go to the submitter. The success message appears only after Cloudflare accepts the email. Delivery to the final mailbox still depends on receiving mail servers.

Every email includes the submission timestamp and `smsConsent: false`. Per Ben's instruction for the initial launch, SMS consent and privacy policy links are omitted. No SMS is sent. No allergies are collected. There is no separate signup database: the hello inbox is the signup record. A future marketing platform must handle unsubscribe requests and bulk email.

Worker commands: `cd worker && npm ci && npm run check && cf deploy --dry-run && cf deploy`. The project uses `cloudflare.config.ts` and the cf CLI. Google Workspace MX and SPF records at the root domain are retained; Cloudflare Email Routing is enabled on the forms subdomain. Run `npm test` from the repository root for validation, failure, CORS, rate limit and honeypot checks.

## Images

All four photography assets are supplied AI concept images, replace with real photos when available. Daylight source variants avoid the visible candle flames and manufacturer logo in the reference's darker pictures. Each has responsive 480, 960 and 1536 pixel WebP versions. Logo assets are supplied PNGs; replace with the designer's SVG files when available. No AI-generated portrait is presented as the founder's daughter; the optional About portrait is omitted.

The supplied creative references and business/legal documents remain outside this repository.

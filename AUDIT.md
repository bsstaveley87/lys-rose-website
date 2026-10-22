# Website audit and remediation

Audit date: October 21, 2026 (America/New_York).
Scope: Home, About, Services, FAQ and Contact; image rendering, mobile conversion/navigation, waitlist frontend and Worker, accessibility, search metadata, structured data, crawlability, build/deployment and public HTTPS.

## Findings and fixes

| Priority | Finding | Result |
| --- | --- | --- |
| High | Flexible detail-image widths were combined with fixed HTML heights and forced aspect ratios. This could stretch image boxes and crop important subjects. | Detail images use natural source proportions, `height: auto`, intrinsic dimensions and a responsive figure grid. No feet, pouch or hood is intentionally cropped from the detail images. |
| High | The mobile hero cropped the supplied bath photo heavily, while an opaque text gradient hid the subject. | Mobile and tablet layouts show the complete bath photo above the copy. Desktop retains the reference’s image-led treatment with a more readable gradient. |
| High | A waitlist action was not reliably visible before scrolling on short/narrow screens. | A direct waitlist action is visible in the header on all pages, with compact mobile navigation and 44px minimum controls. The hero action also precedes the long intro on mobile. |
| High | Basic native required/email and server checks existed, but frontend errors were generic and phone/ZIP formats were unchecked. | Browser and server share validation. Errors are field-specific, associated with inputs, summarized and focused. Optional invalid fields open their disclosure. Whitespace names, malformed email, invalid selections, oversized values, phone and ZIP are checked without requiring optional fields. |
| High | JavaScript-free POSTs did not have a functional confirmation flow. | The Worker handles native URL-encoded form submissions and returns an HTML confirmation/error page. Native HTML constraints remain in place. |
| Medium | Metadata existed but some descriptions were too long, Twitter metadata was incomplete and the share image lacked a standard preview format/dimensions. | One configuration generates page-specific titles/descriptions, canonical URLs, Open Graph/Twitter tags, a 1200×630 JPEG, icons and robots directives. |
| Medium | No consistent machine-readable business/service information or FAQ schema was present. | Organization, WebSite, page, breadcrumb and Service schema use visible facts. FAQPage questions/answers are generated from the actual FAQ content. No invented address, venue, price, review, rating or schedule is added. |
| Medium | Fixed asset names allowed cached CSS/JavaScript to survive a release. | Content-based filenames are generated for CSS, frontend JavaScript and shared validation. |
| Medium | Exported numbered CSS classes and manually duplicated metadata made maintenance fragile. | Components have descriptive classes; copy, responsive styling, validation, metadata and build responsibilities have defined source locations. |
| Medium | The error page was bare and missing mobile/robots metadata. | The styled 404 has a viewport, noindex directive, useful navigation and contact links. |
| Medium | The deployment workflow did not run the audit checks. | GitHub Actions performs a locked install, build and test suite before publishing. Only the built site is deployed. |

The supplied founder/session copy and educational disclaimer are preserved. SMS remains disabled; no allergies are collected. The inbox remains the signup record rather than a separate database.

## Verification

- 26 automated checks cover field validation, MIME composition, JSON and native form handling, provider failure, rate limiting, bounded input, CORS, metadata, schema, FAQ consistency, labels/error associations, links, assets, sitemap, 404, contrast and versioned assets.
- The Worker passes generated binding-type checks and TypeScript checks. Its deployment dry run succeeds.
- Browser layout measurements cover all five pages at 320×568, 390×844, 768×1024, 1440×900 and 844×390. Checks cover horizontal overflow, header CTA visibility/fit, image ratios and minimum control heights.
- axe-core checks run on all five pages at 390px and 1440px after finite entrance animations settle. The settled pages have no automated violations. The desktop image-backed hero requires manual contrast review; the text column ends before the 88%-cream point of the overlay, and a conservative black-image-pixel contrast test passes.
- Manual browser checks cover opening the menu, Escape/focus restoration, empty-form errors, malformed email, optional ZIP/phone errors, preserving input, and opening the optional disclosure.
- Final release smoke checks cover public routes/assets, HTTP/www redirects, an unknown URL’s actual 404 response, public metadata and a live signup accepted by Cloudflare.

These are automated and manual browser checks, not a claim of complete WCAG conformance. The browser available here is one engine; physical Android/iOS devices and external screen readers have not been exhaustively tested.

### Performance measurement limits

| Metric | Measurement |
| --- | --- |
| LCP/FCP/CLS/INP | No representative field data or Lighthouse/DevTools trace was available. No score is claimed. |
| Asset changes | Hero and detail photography use responsive WebP files, the hero is prioritized and below-fold images are lazy loaded. Images and logos have intrinsic dimensions to reserve space. |
| Measured transfer saving | The header/hero/footer lockup changed from a 119,421-byte PNG to a pixel-preserving 97,272-byte lossless WebP. The favicon is a dedicated 32px file rather than the large emblem. |
| Release freshness | Versioned CSS/JavaScript prevent stale browser cache from masking updates. |

## Search and AI discoverability

The site renders its content in HTML, uses canonical page URLs, exposes an XML sitemap and crawlable internal links, and supplies consistent visible facts and schema. Search and AI crawlers can read the founder story, service details and FAQ without executing the menu or form JavaScript.

Google’s [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) says the usual SEO practices apply; there is no separate special AI markup requirement. [Structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) helps describe content but does not guarantee inclusion, rich results, indexing or rankings. FAQ markup is factual organization of the visible answers, not a promise of a Google FAQ rich result.

Remaining external measurement work: connect/verify Search Console and Bing Webmaster Tools, submit the sitemap through those accounts, monitor crawl/index coverage and real search queries, and establish verified local business profiles where appropriate. Those account connections and rankings were not available to this audit. No fabricated local address or unsupported service claim was added to pursue visibility.

## Infrastructure limits to track

Public HTTPS and HTTP/www redirects are supplied by Cloudflare. The existing Full TLS setting encrypts the origin connection, but GitHub’s separate custom-domain certificate was still provisioning during this audit. Do not switch to Full (strict) until that certificate is issued and verified, since it would otherwise break the origin connection. Google Workspace root MX/SPF/DKIM records remain separate from the forms subdomain.

Provider acceptance is tested; receiving-mailbox arrival and spam classification cannot be proven from the Worker response. Failed sends produce an error rather than reporting a successful signup. The site does not send marketing mail or SMS; a future subscription platform will need unsubscribe handling.

## Reproduce

Run `npm ci && npm run build && npm test` and `npm run check:worker`. Use `npm run audit:prepare` to generate local-only responsive and accessibility audit pages, then serve `_site/`. A normal build removes those audit pages before publication. See README.md for deployment commands.

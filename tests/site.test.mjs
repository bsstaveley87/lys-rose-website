import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {site,pages} from '../site.config.mjs';
import {validateFields, interestOptions, limits} from '../assets/validation.js';
import {ADULT_18_ACK, AGE_TOO_OLD_MESSAGE, AGE_TOO_YOUNG_MESSAGE, BATH_BAG_CENTS, BOOKING_LEAD_HOURS, BOOKING_TERMS_VERSION, CHECKOUT_WAIVER_NOTE, CLAUSE_A, CLAUSE_B, CLAUSE_C, CLAUSE_D, DEPOSIT_ACK, DEPOSIT_CENTS, FLORIDA_NOTICE_FONT_PT, FLORIDA_STATUTORY_NOTICE, JOIN_RULE_ACK, MAX_BABY_AGE_MONTHS, MAX_EXTRA_ADULTS, MIN_BABY_AGE_DAYS, PARENT_SIGNATURE_SENTENCE, REFUND_SUMMARY, ROBE_CENTS, ROSE_PETAL_CLAUSE, SEATS_PER_SESSION, renderedWaiverTerms, WAIVER_VERSION_LABEL, SECOND_ADULT_CENTS, SECOND_ADULT_WAIVER_NOTE, SESSION, SESSION_LOCATION, SESSION_LOCATION_NOTE, SESSION_PRICE_CENTS, SICK_CHECKIN_ACK, SICK_CONTACT_ACK, SIGNATURE_HEADING, SIGNATURE_LEAD, WAIVER_BODY_FONT_PT, WAIVER_DISCLAIMER, WAIVER_HEADING, WAIVER_RELEASE_TEXT, ageMonthsAtSession, applyRobeCutoff, babyAgeMessage, bookingIsClosed, DEPOSIT_CONFIRM_ERROR, fillDepositAck, fillRefundSummary, formatCents, initBooking, mountRobeAddon, previewTotal, refundBalanceCents, refundHalfBalanceCents, robeIsClosed, robeNote, sessionDateLabel, sessionPriceLabel, sessionPriceLine, sessionPriceOffer, sessionStatus, sessionTimeLabel, signedCopyHtml, signingDateLabel} from '../assets/booking.js';
const approved = {
  '/': {
    title: 'Lys Rose Baby Spa · Fort Lauderdale',
    description: "A guided session for parents and babies under 12 months: you'll learn a warm floral milk bath, infant massage and a parent-led baby facial. Small group sessions in Fort Lauderdale. Join the waitlist.",
  },
  '/about/': {
    title: 'About · Lys Rose Baby Spa',
    description: "The story behind Lys Rose Baby Spa, named for founder Christy Zemour's daughter.",
  },
  '/services/': {
    title: 'Services · Lys Rose Baby Spa',
    description: "Small group baby spa sessions where you'll learn a warm floral milk bath, guided infant massage and a parent-led baby facial with your own baby, plus light refreshments. Led by caring professionals from the world of babies and new parents. Fort Lauderdale.",
  },
  '/faq/': {
    title: 'FAQ · Lys Rose Baby Spa',
    description: 'Answers about Lys Rose sessions: who they are for, where they happen and how to join the waitlist.',
  },
  '/contact/': {
    title: 'Contact · Lys Rose Baby Spa',
    description: 'Say hello: hello@lysrosebabyspa.com · Instagram @lysrosebabyspa.',
  },
};
const root=new URL('../_site/',import.meta.url);
const documentFor=async file=>parseHTML(await readFile(new URL(file,root),'utf8')).document;
const titles=new Set();
const indexed=pages.filter(page=>!(page.robots||'').startsWith('noindex'));
for(const page of indexed) test(`${page.path}: indexable HTML, SEO, structured data, assets and links`,async()=>{
  const doc=await documentFor(page.file);
  assert.equal(doc.documentElement.lang,'en');
  const title=doc.querySelector('title').textContent;
  assert.equal(page.title, approved[page.path].title);
  assert.equal(title, approved[page.path].title);
  assert.ok(title.length>=20&&title.length<=70);assert.ok(!titles.has(title));titles.add(title);
  assert.equal(doc.querySelectorAll('h1').length,1);
  const description=doc.querySelector('meta[name=description]').content;
  assert.equal(page.description, approved[page.path].description);
  assert.equal(description, approved[page.path].description);
  assert.equal(doc.querySelector('link[rel=canonical]').href,site.origin+page.path);
  assert.match(doc.querySelector('meta[name=robots]').content,/index,follow/);
  assert.equal(doc.querySelector('meta[property="og:title"]').content,title);
  assert.equal(doc.querySelector('meta[property="og:description"]').content,description);
  assert.equal(doc.querySelector('meta[name="twitter:title"]').content,title);
  assert.equal(doc.querySelector('meta[name="twitter:description"]').content,description);
  assert.equal(doc.querySelector('.disclaimer').textContent, "Parents provide all hands-on care while our instructor guides. Lys Rose doesn't offer facials, medical treatments, physical therapy or massage therapy. Our sessions are educational.");
  assert.ok(doc.querySelector('#site-menu .menu-logo'));
  assert.ok([...doc.querySelectorAll('#site-menu nav a')].some(link => link.textContent === 'Home' && link.getAttribute('href') === '/'));
  assert.ok([...doc.querySelectorAll('noscript nav a')].some(link => link.textContent === 'Home'));
  assert.equal(doc.querySelector('meta[property="og:image:width"]').content,'1200');
  assert.equal(doc.querySelector('meta[property="og:image:height"]').content,'630');
  const data=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
  assert.ok(data['@graph'].some(x=>x['@type']==='Organization'));
  assert.ok(data['@graph'].some(x=>x['@type']==='WebSite'));
  assert.ok(doc.querySelector('.header-waitlist[href="/#waitlist"]'));
  assert.ok(doc.querySelector('noscript nav'));
  const ids=[...doc.querySelectorAll('[id]')].map(el=>el.id);assert.equal(ids.length,new Set(ids).size);
  for(const el of doc.querySelectorAll('a[href],img[src],link[href],script[src]')) {
    const value=el.getAttribute('src')||el.getAttribute('href');
    if(value.startsWith('mailto:')||value.includes('fonts.googleapis.com')||value.includes('fonts.gstatic.com')||value.startsWith('https://instagram.com'))continue;
    const url=new URL(value,site.origin+page.path);
    if(url.origin!==site.origin)continue;
    let path=url.pathname.slice(1);if(!path||path.endsWith('/'))path+='index.html';
    assert.ok((await stat(new URL(path,root))).isFile(),value);
    if(url.hash) {
      const target=await documentFor(path);
      assert.ok(target.getElementById(url.hash.slice(1)),`Missing anchor ${value}`);
    }
  }
  for(const img of doc.querySelectorAll('img')) {assert.ok(img.hasAttribute('alt'));assert.ok(+img.width>0&&+img.height>0);}
});
test('FAQ schema mirrors every visible answer exactly',async()=>{
  const doc=await documentFor('faq/index.html');
  const data=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
  const faq=data['@graph'].find(x=>x['@type']==='FAQPage');
  const items=[...doc.querySelectorAll('.faq-item')];assert.equal(faq.mainEntity.length,items.length);assert.equal(items.length,16);
  items.forEach((item,i)=>assert.equal(faq.mainEntity[i].acceptedAnswer.text,[...item.querySelectorAll('p')].map(p=>p.textContent.trim()).join('\n\n')));
});
test('form controls have explicit accessible labels and inline error associations',async()=>{
  const doc=await documentFor('index.html');
  for(const input of doc.querySelectorAll('#waitlist-form input:not([type=checkbox]):not([name=website]),#waitlist-form select')) {
    assert.ok(doc.getElementById(input.getAttribute('aria-labelledby')));
    assert.ok(doc.getElementById(input.getAttribute('aria-describedby')));
    assert.ok(doc.querySelector(`label[for="${input.id}"]`));
  }
  assert.ok(doc.querySelector('[name=parentName][required]'));
  assert.ok(doc.querySelector('[name=email][type=email][required]'));
  assert.equal(doc.querySelector('[name=zip]').getAttribute('maxlength'),'10');
});
test('validation accepts real-world names, optional blanks, international phone and ZIP+4',()=>{
  for(const parentName of ['Élodie O’Neill','李','A','Anne-Marie','João'])assert.deepEqual(validateFields({parentName,email:'hello+waitlist@lysrosebabyspa.com',zip:'33301-1234',phone:'+1 (954) 555-0100'}),{});
  assert.deepEqual(validateFields({parentName:'Ben',email:'ben@example.com',zip:'',phone:'',interests:[]}),{});
});
test('preferred dates and preferred times are not collected',async()=>{
  assert.equal(Object.hasOwn(limits,'preferredDates'),false);
  assert.equal(Object.hasOwn(limits,'preferredTimes'),false);
  const doc=await documentFor('index.html');
  const html=doc.documentElement.outerHTML;
  for (const phrase of ['preferredDates','preferredTimes','PREFERRED DATES','PREFERRED TIMES']) assert.equal(html.includes(phrase),false,phrase);
  assert.equal(doc.querySelector('#waitlist-form [name=preferredDates]'),null);
  assert.equal(doc.querySelector('#waitlist-form [name=preferredTimes]'),null);
  const referral=doc.querySelector('#waitlist-form [name=referral]');
  assert.equal(referral.tagName,'INPUT');
  assert.equal(referral.getAttribute('type'),'text');
  assert.deepEqual(validateFields({parentName:'Ben',email:'ben@example.com',preferredDates:'Saturday\n'+'x'.repeat(500)}),{});
  assert.deepEqual(validateFields({parentName:'Ben',email:'ben@example.com',preferredDates:['Saturday']}),{});
});
test('validation rejects whitespace names, malformed emails, ZIP and phone, wrong types, oversized values',()=>{
  const good={parentName:'Ben',email:'ben@example.com',interests:[]};
  for(const [field,value] of [['parentName','   '],['parentName','1234'],['email','bad@'],['email','x..y@example.com'],['email','x@bad_domain.com'],['phone','call me'],['phone','1234'],['zip','abcde'],['zip','123456'],['email',['x@example.com']],['babyAge','6–12 months'],['area','invalid'],['referral','x'.repeat(201)]])assert.ok(validateFields({...good,[field]:value})[field],`${field}: ${value}`);
});
test('detail images preserve original aspect ratios rather than fixed-height crops',async()=>{
  const doc=await documentFor('index.html');
  assert.equal(doc.querySelectorAll('.detail-grid figure').length,3);
  const css=await readFile(new URL('assets/site.css',root),'utf8');
  assert.match(css,/\.detail-image\s*\{[^}]*height:auto/);
  assert.match(css,/\.detail-grid figure\s*\{[^}]*aspect-ratio:auto/);
  assert.ok(doc.querySelector('.hero-media .hero-photo'));
});
test('sitemap includes exactly the canonical pages and 404 is not indexed',async()=>{
  const xml=await readFile(new URL('sitemap.xml',root),'utf8');
  for(const page of indexed)assert.ok(xml.includes(`<loc>${site.origin+page.path}</loc>`));
  assert.equal((xml.match(/<url>/g)||[]).length,indexed.length);
  const doc=await documentFor('404.html');assert.equal(doc.querySelector('meta[name=robots]').content,'noindex,follow');
});
test('versioned assets are referenced consistently',async()=>{
  const doc=await documentFor('index.html');
  assert.match(doc.querySelector('script[type=module][src]').src,/site\.[a-f0-9]{12}\.js$/);
  assert.ok([...doc.querySelectorAll('link[rel=stylesheet]')].some(x=>/site\.[a-f0-9]{12}\.css$/.test(x.href)));
});

test('preview copy removes the flagged phrases and keeps the approved lines', async () => {
  assert.deepEqual(interestOptions, ['Milk bath', 'Infant massage', 'Parent-led baby facial', 'The full new parent experience', 'Other']);
  assert.deepEqual([...(await documentFor('index.html')).querySelectorAll('[name=interests]')].map(input => input.getAttribute('value')), interestOptions);
  const read = file => readFile(new URL(file, root), 'utf8');
  const home = await read('index.html');
  const about = await read('about/index.html');
  const services = await read('services/index.html');
  const faq = await read('faq/index.html');
  const all = home + about + services + faq;
  for (const phrase of ['Mini photoshoot', 'À bientôt', 'experienced practitioner', 'Places in each small group are limited.', 'spots']) assert.equal(all.includes(phrase), false, phrase);
  assert.ok(faq.includes("No. Parents provide all hands-on care while our instructor guides. Lys Rose doesn't offer facials, medical treatments, physical therapy or massage therapy. Our sessions are educational."));
  assert.ok(about.includes('See you soon'));
  assert.ok(about.includes('White lilies and blush roses, for the lily in the Lys Rose name.'));
  assert.equal(services.includes('Le Petit Rituel'), false);
  assert.equal(services.includes('take-home kit'), false);
  assert.ok(services.includes('Slots are limited. Join the waitlist for early access to session reservations.'));
  assert.ok(home.includes('FORT LAUDERDALE &amp; NEARBY'));
  assert.ok(home.includes('Inspired by Lily Rose.<br>Shared with love.') || home.includes('Inspired by Lily Rose.<br/>Shared with love.'));
  const css = await read('assets/site.css');
  assert.match(css, /\.hero-location\s*\{[^}]*border-top:\s*1px solid #BFA695/);
  assert.doesNotMatch(css, /#B77F1A/);
  assert.doesNotMatch(css, /\.hero-lockup\s*\{[^}]*display:\s*none/);
  const data = JSON.parse((await documentFor('faq/index.html')).querySelector('script[type="application/ld+json"]').textContent);
  const answer = data['@graph'].find(node => node['@type'] === 'FAQPage').mainEntity.find(item => item.name === 'Is this a medical or therapy service?').acceptedAnswer.text;
  assert.equal(answer, "No. Parents provide all hands-on care while our instructor guides. Lys Rose doesn't offer facials, medical treatments, physical therapy or massage therapy. Our sessions are educational.");
});
test('booking preview is unlisted, has no seat count, and prices stay off public pages', async () => {
  const book = await documentFor('book/index.html');
  const html = book.documentElement.outerHTML;
  assert.equal(book.querySelector('meta[name=robots]').content, 'noindex,nofollow');
  const event = JSON.parse(book.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(event['@type'], 'Event');
  assert.equal(event.startDate, undefined);
  assert.equal(event.endDate, undefined);
  assert.equal(event.location['@type'], 'Place');
  assert.deepEqual(event.location.address, { '@type': 'PostalAddress', addressLocality: 'Fort Lauderdale', addressRegion: 'FL' });
  assert.equal(event.location.address.streetAddress, undefined);
  assert.equal(event.location.name, undefined);
  assert.equal(event.offers['@type'], 'Offer');
  assert.equal(event.offers.price, sessionPriceOffer());
  assert.equal(event.offers.priceCurrency, 'USD');
  assert.equal(Object.hasOwn(event, 'remainingAttendeeCapacity'), false);
  assert.equal(Object.hasOwn(event.offers, 'eligibleQuantity'), false);
  assert.equal(book.querySelector('.footer-tagline').textContent, 'Inspired by Lily Rose. Shared with love.');
  assert.equal(book.querySelector('.disclaimer').textContent, "Parents provide all hands-on care while our instructor guides. Lys Rose doesn't offer facials, medical treatments, physical therapy or massage therapy. Our sessions are educational.");
  assert.equal(/\b12\s+spots\b/i.test(html), false);
  assert.equal(html.toLowerCase().includes('spots remaining'), false);
  assert.equal(html.toLowerCase().includes('group size'), false);
  assert.equal(/venue/i.test(book.body.textContent), false);
  assert.equal(html.includes('Dates coming soon'), false);
  assert.equal(book.querySelectorAll('#booking-dates .date-card').length, 1);
  assert.equal(book.querySelector('#session-date').textContent, 'Date to be announced');
  assert.equal(book.querySelector('#session-time').textContent, 'Time to be announced');
  assert.equal(book.querySelector('#session-location').textContent, SESSION_LOCATION);
  assert.equal(book.querySelector('#session-location-note').textContent, SESSION_LOCATION_NOTE);
  assert.equal(book.querySelector('#checkout-location').textContent, SESSION_LOCATION);
  assert.equal(book.querySelector('#checkout-location-note').textContent, SESSION_LOCATION_NOTE);
  assert.equal(book.querySelector('meta[name=description]').content.includes(SESSION_LOCATION), true);
  assert.equal(book.querySelector('.session-cutoff').textContent, 'Booking closes about 48 hours before each session.');
  assert.equal(html.includes('December 6'), false);
  assert.equal(html.includes('November 22'), false);
  assert.equal(html.includes('10:30 AM'), false);
  assert.equal(book.querySelector('#booking-dates [data-booking-card]'), null);
  assert.deepEqual([...book.querySelectorAll('#booking-checkout input')].map(input => input.getAttribute('name')), ['confirmReady']);
  assert.equal(book.querySelector('.card-mock'), null);
  assert.equal(book.querySelector('.booking-pay').getAttribute('type'), 'button');
  assert.equal(book.querySelector('.booking-intro').textContent, 'A session for you and your baby: a warm floral milk bath, infant massage and a parent-led baby facial.');
  const homeDoc = await documentFor('index.html');
  assert.equal(homeDoc.querySelector('.hero-intro').textContent, 'A session for you and your baby: a warm floral milk bath, infant massage and a parent-led baby facial.');
  const homeSteps = [...homeDoc.querySelectorAll('.session-list h3')];
  assert.deepEqual(homeSteps.map(node => node.textContent), ['A warm floral milk bath', 'Guided infant massage', 'An intimate small group']);
  assert.equal(homeSteps[0].nextElementSibling.textContent, 'A warm floral milk bath, then a soft baby robe set for a photo moment.');
  assert.equal(homeSteps[1].nextElementSibling.textContent, 'Infant massage, with a caring expert in babies and new parents.');
  assert.equal(homeSteps[2].nextElementSibling.textContent, 'A small group of parents. In Fort Lauderdale, or at home on request.');
  const servicesDoc = await documentFor('services/index.html');
  const serviceHeads = [...servicesDoc.querySelectorAll('h3')];
  assert.equal(serviceHeads[0].textContent, 'i. A warm floral milk bath');
  assert.equal(serviceHeads[0].nextElementSibling.textContent, "We prepare a warm floral milk bath, and you'll learn to bathe your baby in it, with our guidance.");
  assert.equal(serviceHeads[1].textContent, 'ii. Guided infant massage');
  assert.equal(serviceHeads[1].nextElementSibling.textContent, "You'll learn infant massage step by step, guided by a caring professional from the world of babies and new parents, as you massage your own baby.");
  assert.equal(serviceHeads[2].textContent, 'iii. Parent-led baby facial');
  assert.equal(/\bcream\b/i.test(servicesDoc.body.textContent), false);
  assert.equal(servicesDoc.body.textContent.includes('A take-home baby robe is available to add'), false);
  assert.equal(book.querySelector('.booking-price').textContent, sessionPriceLine());
  assert.equal(book.querySelector('.price-note'), null);
  assert.equal(html.includes('$280'), false);
  assert.equal(html.includes('per mom and baby'), false);
  assert.equal(html.includes('Taxes may apply to add-ons.'), false);
  assert.equal((html.match(/Taxes may apply to enhancements\./g) || []).length, 3);
  const bookSource = await readFile(new URL('../book/index.html', import.meta.url), 'utf8');
  assert.equal(bookSource.includes('SESSION_PRICE'), true);
  assert.equal(bookSource.includes('28500'), false);
  assert.equal(bookSource.includes('$285'), false);
  assert.equal(html.includes('This is the price before taxes and processing fees.'), false);
  assert.equal(html.toLowerCase().includes('processing fee'), false);
  assert.equal(html.includes('$TBD'), false);
  assert.equal(html.includes('Take-home robe set'), false);
  assert.equal(html.includes('gift bag'), false);
  assert.equal((html.match(/available to add/g) || []).length, 0);
  assert.equal(ROBE_CENTS, null);
  assert.equal(book.querySelector('#robe-addon'), null);
  assert.equal(html.includes('Embroidered Keepsake Robe'), false);
  assert.equal(html.includes('Coming soon'), false);
  assert.equal(html.includes('this option closes 14 days before your session'), false);
  assert.equal(book.querySelector('#bath-bag-addon .addon-price').textContent, '+$18');
  assert.equal(book.querySelector('#bath-bag-addon [name=bathBag]').hasAttribute('disabled'), false);
  assert.equal(html.includes('$24'), false);
  assert.equal(BATH_BAG_CENTS, 1800);
  assert.equal(book.querySelector('#second-adult-addon .addon-price').textContent, '+$25');
  assert.equal(book.querySelector('#second-adult-addon .enhancement-note').textContent, 'One per parent-and-baby place, chosen when you book.');
  assert.equal(book.querySelector('#second-adult-addon [name=secondAdult]').hasAttribute('disabled'), false);
  assert.equal(SECOND_ADULT_CENTS, 2500);
  assert.deepEqual(previewTotal(false, 'signature', true), {cents: SESSION_PRICE_CENTS + BATH_BAG_CENTS, label: `$${(SESSION_PRICE_CENTS + BATH_BAG_CENTS) / 100}`, addonPending: false});
  assert.deepEqual(previewTotal(false, 'signature', false, true), {cents: SESSION_PRICE_CENTS + SECOND_ADULT_CENTS, label: `$${(SESSION_PRICE_CENTS + SECOND_ADULT_CENTS) / 100}`, addonPending: false});
  assert.ok(html.includes('Le Petit Plus (The Little Extras)'));
  assert.equal(book.querySelector('.extras-when').textContent, "All extras are chosen when you book and can't be added later.");
  assert.equal(html.includes('Premium enhancements'), false);
  assert.equal(html.includes('Optional add-ons'), false);
  assert.equal(html.includes('Photography'), false);
  assert.equal(html.includes('Premium Face Crème'), false);
  assert.equal(html.toLowerCase().includes('evereden'), false);
  assert.equal(html.toLowerCase().includes('mustela'), false);
  const faceCream = book.querySelector('.face-cream');
  assert.equal(faceCream.querySelector('legend').textContent, 'Face crème');
  assert.equal(/\bcream\b/i.test(book.body.textContent), false);
  assert.deepEqual([...faceCream.querySelectorAll('[name=faceCream]')].map(input => ({
    value: input.value,
    checked: input.hasAttribute('checked'),
    label: input.closest('label').textContent,
  })), [
    {value: 'signature', checked: true, label: 'Signature face crèmeIncluded'},
    {value: 'gentle', checked: false, label: 'Gentle face crème+$5'},
    {value: 'premium', checked: false, label: 'Premium face crème+$10'},
  ]);
  const robeLine = 'Personalized robes are embroidered to order, so this option closes 14 days before your session.';
  assert.equal(robeNote(''), robeLine);
  assert.equal(robeNote('2026-12-06'), 'Personalized robes are embroidered to order, so this option closes 14 days before your session (November 22 for December 6).');
  assert.equal(robeIsClosed('2026-12-06', new Date('2026-11-22T23:59:59-05:00')), false);
  assert.equal(robeIsClosed('2026-12-06', new Date('2026-11-23T05:00:00Z')), true);
  assert.equal(robeNote('2027-01-10'), 'Personalized robes are embroidered to order, so this option closes 14 days before your session (December 27 for January 10).');
  assert.equal(robeIsClosed(''), false);
  assert.equal(SESSION, null);
  assert.equal(BOOKING_LEAD_HOURS, 48);
  assert.equal(sessionDateLabel(null), 'Date to be announced');
  assert.equal(sessionTimeLabel(null), 'Time to be announced');
  assert.equal(sessionDateLabel({date:'2026-12-06', start:'10:30', end:'12:30'}), 'Sunday, December 6, 2026');
  assert.equal(sessionTimeLabel({date:'2026-12-06', start:'10:30', end:'12:30'}), '10:30 AM to 12:30 PM');
  const announced = {date:'2026-12-06', start:'10:30', end:'12:30'};
  assert.equal(bookingIsClosed(null, new Date('2026-12-06T16:00:00Z')), false);
  assert.equal(bookingIsClosed(announced, new Date('2026-12-04T15:29:00Z')), false);
  assert.equal(bookingIsClosed(announced, new Date('2026-12-04T15:30:00Z')), true);
  assert.equal(book.querySelector('#bath-choice legend').textContent, 'Choose your bath');
  assert.deepEqual([...book.querySelectorAll('[name=bath]')].map(input => input.value), ['floral-milk-soak', 'byob']);
  assert.deepEqual([...book.querySelectorAll('[name=bath]')].map(input => input.closest('label').textContent.trim()), ['Floral Milk Soak', 'BYOB (Bring your own breastmilk)']);
  for (const input of book.querySelectorAll('[name=bath]')) assert.equal(input.hasAttribute('required'), true);
  assert.equal(book.querySelector('#byob-details').hasAttribute('hidden'), true);
  assert.equal(book.querySelector('#floral-details').hasAttribute('hidden'), true);
  assert.equal(book.querySelector('#byob-note').textContent, "Bring your breastmilk cold or frozen. We can warm it for you on site. You'll add it to your baby's bath yourself.");
  assert.equal(book.querySelector('[name=petalFree]').closest('label').textContent.trim(), 'Petal-free bath (no rose petals)');
  assert.equal(book.querySelector('#floral-petals-note').textContent, "Choose now; petals can't be added or removed once the bath begins.");
  assert.equal(book.querySelector('[name=rosePetals]').closest('label').textContent.trim(), 'Add complimentary rose petals');
  assert.equal(book.querySelector('#rose-petals-note').textContent, "Choose now; petals can't be added or removed once the bath begins.");
  assert.equal(book.querySelector('[name=rosePetals]').hasAttribute('required'), false);
  assert.equal(html.includes('The Lys Rose at Home Kit'), false);
  assert.equal(html.includes('The at-home baby spa kit.'), false);
  assert.equal(html.includes('toiletry bag'), false);
  assert.equal(html.includes('mini face kit'), false);
  assert.equal(book.querySelector('.kit-enhancement'), null);
  assert.equal(book.querySelector('[name=kitSize]'), null);
  assert.equal(html.includes('The "Spa à la Maison" Kit (Spa at home)'), false);
  assert.equal(html.includes('At-home spa kit for your mini'), false);
  assert.ok(html.includes('The Lys Rose Floral Milk Bath Bag'));
  assert.equal(html.includes('The Lys Rose Floral Bath Bag'), false);
  assert.ok(html.includes('Our floral milk bath to take home: 4–6 uses in a baby bath, or 1–2 in a shallow full-size tub.'));
  assert.ok(html.includes('Ingredients: organic coconut milk powder, organic colloidal oatmeal, organic dried rose petals.'));
  assert.equal((html.match(/organic/gi) || []).length, 3);
  for (const file of ['index.html','about/index.html','services/index.html','faq/index.html','contact/index.html']) {
    assert.equal((await readFile(new URL(file, root), 'utf8')).toLowerCase().includes('organic'), false, file);
  }
  assert.equal(html.includes("A single bag of our floral bath soak to take home for your baby's bath."), false);
  assert.equal(html.includes('The Floral Bath Soak'), false);
  assert.equal(html.toLowerCase().includes('sparkling toast'), false);
  assert.equal(html.toLowerCase().includes('bubbly'), false);
  assert.equal(html.includes('Full ingredient list below.'), false);
  assert.equal(html.includes('Optional, $10:'), false);
  assert.equal(book.querySelector('.ingredient-list'), null);
  assert.equal(book.querySelector('[name=ingredientAck]'), null);
  assert.equal(html.includes('5 g'), false);
  assert.equal(html.toLowerCase().includes('full jar'), false);
  assert.equal(html.includes('$5 or $10'), false);
  assert.equal(html.includes('$5 (a small amount)'), false);
  assert.equal(book.querySelector('[name=faceCareUpgrade]'), null);
  assert.equal(book.querySelector('.jar-option'), null);
  assert.equal(html.includes('Water (Aqua), Glycerin, Simmondsia Chinensis (Jojoba) Seed Oil'), false);
  assert.equal(html.includes("I've read the ingredients and will share any allergies with Lys Rose. [Allergy acknowledgment wording pending review]"), false);
  assert.equal(book.querySelector('#booking-total').textContent, sessionPriceLabel());
  assert.equal(book.querySelector('#face-cream-charge').hasAttribute('hidden'), true);
  assert.deepEqual(previewTotal(false, 'signature'), {cents:SESSION_PRICE_CENTS, label:sessionPriceLabel(), addonPending:false});
  assert.deepEqual(previewTotal(false, 'gentle'), {cents:SESSION_PRICE_CENTS + 500, label:`$${(SESSION_PRICE_CENTS + 500) / 100}`, addonPending:false});
  assert.deepEqual(previewTotal(false, 'premium'), {cents:SESSION_PRICE_CENTS + 1000, label:`$${(SESSION_PRICE_CENTS + 1000) / 100}`, addonPending:false});
  assert.deepEqual(previewTotal(false, 'premium', true, true), {cents: SESSION_PRICE_CENTS + 1000 + BATH_BAG_CENTS + SECOND_ADULT_CENTS, label: `$${(SESSION_PRICE_CENTS + 1000 + BATH_BAG_CENTS + SECOND_ADULT_CENTS) / 100}`, addonPending: false});
  for (const word of ['hypoallergenic', 'soothing']) assert.equal(html.toLowerCase().includes(word), false, word);
  assert.equal(/\bfacial\b/i.test(html.toLowerCase().replaceAll('parent-led baby facial','').replaceAll('facials','')), false);
  const included = [
    'A 2-hour session for you and your baby, led by a caring expert in babies and new parents',
    'Your own baby bath, soft towels and a cozy station, all set up for you',
    'A floral milk bath with our Floral Milk Soak',
    'Baby massage and a parent-led baby facial',
    'Petit cadeau: a little gift',
    'A spa photo op in a soft baby robe set',
    'Refreshments, light bites and fresh florals',
    'An intimate small group',
    'We handle the laundry and cleanup, so you can simply enjoy',
  ];
  for (const line of included) assert.ok(html.includes(line), line);
  const home = await readFile(new URL('index.html', root), 'utf8');
  for (const line of included) assert.ok(home.includes(line), line);
  const bring = "Bring your baby, anything you need for feeding, and your diaper bag. There is limited space for strollers, so we kindly ask you to bring only your car seat. We take care of the rest.";
  const faqDoc = await documentFor('faq/index.html');
  const faqData = JSON.parse(faqDoc.querySelector('script[type="application/ld+json"]').textContent);
  const faqEntities = faqData['@graph'].find(node => node['@type'] === 'FAQPage').mainEntity;
  const refundAnswer = faqEntities.find(item => item.name === 'What is your refund policy?').acceptedAnswer.text;
  assert.equal(refundAnswer, `Draft ${fillRefundSummary()} Full booking & refund policy`);
  const partnerAnswer = faqEntities.find(item => item.name === 'Can I bring twins, or come with a partner?').acceptedAnswer.text;
  assert.equal(partnerAnswer, "Twins are welcome. Please come with a second adult, such as a partner, grandparent or aunt, so each baby has their own grown-up, and book a separate place for each twin. A second parent or family member can also join one parent-and-baby place for an add-on fee, chosen when you book; we'll share the details when sessions open.");
  assert.equal(partnerAnswer.includes('$'), false);
  const bringAnswer = faqEntities.find(item => item.name === 'What should I bring?').acceptedAnswer.text;
  assert.equal(bringAnswer, bring);
  const includedAnswer = faqEntities.find(item => item.name === "What's included in my session?").acceptedAnswer.text;
  assert.match(includedAnswer, /What's included/);
  assert.ok(includedAnswer.includes('A 2-hour session for you and your baby, with a floral milk bath, baby massage and a parent-led baby facial, a spa photo op in a soft baby robe set, refreshments, light bites and fresh florals. We handle the laundry and cleanup, so you can simply enjoy. Petit cadeau: a little gift.'));
  assert.equal(/\bjar\b|face cream/i.test(includedAnswer), false);
  assert.ok(includedAnswer.includes('We handle the laundry and cleanup, so you can simply enjoy.'));
  assert.equal(includedAnswer.toLowerCase().includes('sparkling'), false);
  assert.equal(html.includes('[Waiver wording pending attorney review]'), false);
  assert.ok(html.includes('Allergies or sensitivities we should know about'));
  assert.equal(html.includes('Allergies, sensitivities or skin conditions (for example a rash, eczema or broken skin)'), false);
  assert.ok(book.querySelector('[name=allergies][value=None]'));
  assert.equal(book.querySelector('[name=waiver]'), null);
  assert.equal(book.querySelector('[name=photoRelease]').hasAttribute('checked'), false);
  assert.equal(book.querySelector('[name=photoRelease]').hasAttribute('required'), false);
  assert.equal(book.querySelector('.booking-pay').hasAttribute('disabled'), true);
  assert.equal(book.querySelector('.booking-pay').getAttribute('aria-disabled'), 'true');
  assert.equal(book.querySelector('#refund-policy').textContent, `Draft ${fillRefundSummary()} Full booking & refund policy · Read the waiver`);
  assert.equal(book.querySelector('#refund-policy a').getAttribute('href'), '/book/policy/');
  assert.equal(book.querySelector('[data-read-waiver]').getAttribute('href'), '/book/waiver/read/');
  assert.equal(book.querySelector('[data-read-waiver]').getAttribute('target'), '_blank');
  assert.equal(book.querySelector('[data-read-waiver]').getAttribute('rel'), 'noopener');
  assert.equal(book.querySelector('[data-read-waiver]').textContent, 'Read the waiver');
  assert.equal(book.querySelector('[data-read-waiver]').closest('button'), null);
  assert.equal(book.querySelector('[data-checkout-waiver-note]').textContent, CHECKOUT_WAIVER_NOTE);
  assert.equal(book.querySelector('#payment-choice'), null);
  assert.equal(book.querySelector('[name=paymentMode]'), null);
  assert.equal(book.querySelector('#balance-note'), null);
  assert.equal(book.body.textContent.includes('Pay the $100 deposit now'), false);
  assert.equal(book.body.textContent.includes('balance is still due'), false);
  assert.equal(book.querySelector('.booking-pay').textContent, 'Reserve and pay');
  assert.equal(book.querySelector('#second-adult-fields').hasAttribute('hidden'), true);
  assert.equal(book.querySelector('[data-second-adult-waiver-note]').textContent, SECOND_ADULT_WAIVER_NOTE);
  assert.deepEqual([...book.querySelectorAll('#booking-checkout input')].map(input => input.getAttribute('name')), ['confirmReady']);
  assert.equal(html.toLowerCase().includes('stripe'), false);
  assert.equal(html.toLowerCase().includes('square'), false);
  const thanks = await documentFor('book/thank-you/index.html');
  assert.equal(thanks.querySelector('meta[name=robots]').content, 'noindex,nofollow');
  assert.equal(thanks.querySelector('h1').textContent, 'Thank you');
  assert.equal(thanks.querySelector('.booking-tagline').textContent, 'Inspired by Lily Rose. Shared with love.');
  assert.ok(thanks.body.textContent.includes('Your booking is being confirmed. An email is coming.'));
  assert.equal(thanks.documentElement.outerHTML.toLowerCase().includes('square'), false);
  assert.equal(thanks.documentElement.outerHTML.includes('$'), false);
  const robots = await readFile(new URL('robots.txt', root), 'utf8');
  assert.match(robots, /Disallow: \/book\//);
  const xml = await readFile(new URL('sitemap.xml', root), 'utf8');
  assert.equal(xml.includes('/book/'), false);
  for (const page of pages) {
    const doc = await documentFor(page.file);
    assert.equal([...doc.querySelectorAll('nav a, header a, footer a')].some(link => (link.getAttribute('href') || '').includes('/book')), false, page.path);
  }
  for (const page of pages.filter(item => item.path !== '/book/' && item.path !== '/book/policy/' && item.path !== '/privacy/')) {
    let text = await readFile(new URL(page.file, root), 'utf8');
    if (page.path === '/faq/') text = text.replaceAll(fillRefundSummary(), '');
    assert.equal(text.includes('$'), false, page.path);
    assert.equal(text.toLowerCase().includes('square'), false, page.path);
    assert.equal(text.includes('per mom and baby'), false, page.path);
    assert.equal(text.includes('Taxes may apply'), false, page.path);
  }
  assert.equal(book.querySelector('#baby-dob').getAttribute('type'), 'date');
  assert.equal(book.querySelector('#baby-dob').hasAttribute('required'), true);
  assert.equal(book.querySelector('#baby-dob-label').textContent, "Baby's date of birth");
  assert.equal(book.querySelector('#baby-dob').getAttribute('autocomplete'), 'bday');
  assert.equal(book.querySelector('#baby-dob-hint').textContent, 'For babies from 4 weeks to 12 months old on the day of the session.');
  assert.equal(html.includes('8 weeks'), false);
  assert.equal(html.includes('8-week'), false);
  assert.equal(book.querySelector('#session-products'), null);
  assert.equal(book.querySelector('#skip-products'), null);
  assert.equal(book.querySelector('#age-confirmation'), null);
  assert.equal(html.includes('In your session'), false);
  assert.equal(html.includes('Prefer to skip'), false);
  assert.equal(html.includes('Skip any of these'), false);
  assert.equal(book.querySelector('#booking-confirm-heading').textContent, 'Before you book, please confirm:');
  const confirmations = [
    "My baby will be at least 4 weeks old and no older than 12 months on the session date, and my baby's umbilical cord stump has fallen off and the area is fully healed, my baby's skin has no breaks, and if my baby has been circumcised, the circumcision site is fully healed.",
    "I understand there's no refund or discount for skipping any part of the session.",
  ];
  const confirmBoxes = [...book.querySelectorAll('[name=confirmReady]')];
  const approvedValues = new Set(['age', 'price']);
  assert.equal(book.querySelector('[name=confirmReady][value=pediatrician]'), null);
  assert.equal(book.querySelector('[name=confirmReady][value=symptoms]'), null);
  assert.equal(book.querySelector('[name=confirmReady][value=illness]'), null);
  assert.deepEqual(confirmBoxes.filter(input => approvedValues.has(input.value)).map(input => input.closest('label').textContent), confirmations);
  for (const input of confirmBoxes.filter(input => input.value !== 'byob')) assert.equal(input.hasAttribute('required'), true, input.value);
  assert.equal(book.querySelector('[name=confirmReady][value=byob]').hasAttribute('required'), false);
  const draftAcks = {join: JOIN_RULE_ACK, checkin: SICK_CHECKIN_ACK, contact: SICK_CONTACT_ACK};
  for (const [value, sentence] of Object.entries(draftAcks)) {
    const box = book.querySelector(`[name=confirmReady][value=${value}]`);
    assert.equal(box.hasAttribute('required'), true, value);
    assert.equal(box.closest('label').querySelector('[data-ack]').textContent, sentence, value);
    assert.equal(box.closest('label').textContent.includes('Draft'), true, value);
  }
  assert.equal(book.querySelector('[data-deposit-ack]').textContent, fillDepositAck());
  assert.equal(book.querySelector('[name=confirmReady][value=deposit]').hasAttribute('required'), true);
  assert.equal(book.querySelector('[name=healthPolicy]'), null);
  assert.equal(book.querySelector('[name=confirmReady][value=health]'), null);
  assert.equal(MIN_BABY_AGE_DAYS, 28);
  assert.equal(MAX_BABY_AGE_MONTHS, 12);
  assert.equal(sessionStatus(0), 'Available');
  assert.equal(sessionStatus(SEATS_PER_SESSION - 1), 'Available');
  assert.equal(sessionStatus(SEATS_PER_SESSION), 'Fully booked');
  assert.deepEqual(previewTotal(true), {cents:SESSION_PRICE_CENTS, label:sessionPriceLabel(), addonPending:true});
  assert.equal(previewTotal(false).addonPending, false);
  const sessionDay = '2026-12-06';
  assert.equal(babyAgeMessage('2026-11-08', sessionDay), '');
  assert.equal(babyAgeMessage('2026-11-09', sessionDay), AGE_TOO_YOUNG_MESSAGE);
  assert.equal(babyAgeMessage('2025-12-06', sessionDay), '');
  assert.equal(babyAgeMessage('2025-12-05', sessionDay), AGE_TOO_OLD_MESSAGE);
  assert.equal(babyAgeMessage('2026-11-08', new Date(2026, 10, 1)), AGE_TOO_YOUNG_MESSAGE);
  assert.equal(babyAgeMessage('2024-02-29', '2025-02-28'), '');
  assert.equal(babyAgeMessage('2024-02-29', '2025-03-01'), AGE_TOO_OLD_MESSAGE);
  assert.equal(babyAgeMessage('', sessionDay), "Please enter your baby's date of birth.");
  assert.equal(babyAgeMessage('2026-02-31', sessionDay), 'Please enter a valid date of birth.');
});
test('the booking form shows both age limits before checkout', () => {
  const {document: doc} = parseHTML(`<!doctype html><html><body><form id="booking-form"><label><input id="baby-dob" name="babyDob" type="date" required/></label><span id="baby-dob-error" hidden></span><span data-refund-summary></span><span data-deposit-ack></span><span data-ack="join"></span><button class="booking-pay" type="button" disabled aria-disabled="true"></button></form></body></html>`);
  initBooking(doc);
  const dob = doc.querySelector('#baby-dob');
  const error = doc.querySelector('#baby-dob-error');
  const today = new Date();
  const iso = days => new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - days)).toISOString().slice(0, 10);
  dob.value = iso(10);
  dob.dispatchEvent(new doc.defaultView.Event('change'));
  assert.equal(error.hidden, false);
  assert.equal(error.textContent, AGE_TOO_YOUNG_MESSAGE);
  dob.value = iso(400);
  dob.dispatchEvent(new doc.defaultView.Event('change'));
  assert.equal(error.textContent, AGE_TOO_OLD_MESSAGE);
  dob.value = iso(40);
  dob.dispatchEvent(new doc.defaultView.Event('change'));
  assert.equal(error.hidden, true);
  assert.equal(error.textContent, '');
  assert.equal(doc.querySelector('[data-refund-summary]').textContent, fillRefundSummary());
  assert.equal(doc.querySelector('[data-deposit-ack]').textContent, fillDepositAck());
  assert.equal(doc.querySelector('[data-ack=join]').textContent, JOIN_RULE_ACK);
  assert.match(dob.max, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(dob.min, /^\d{4}-\d{2}-\d{2}$/);
});
test('refund dollars come from the session price and the deposit', () => {
  assert.equal(DEPOSIT_CENTS, 10000);
  assert.equal(refundBalanceCents(), SESSION_PRICE_CENTS - DEPOSIT_CENTS);
  assert.equal(refundHalfBalanceCents(), Math.round((SESSION_PRICE_CENTS - DEPOSIT_CENTS) / 2));
  assert.equal(fillRefundSummary(), "$100 of your $285 payment is nonrefundable and holds your spot. If you cancel 7 or more days before your session, we refund the remaining balance of $185. If you cancel less than 7 days but at least 48 hours before, we refund half of it ($92.50). Within 48 hours, the remaining balance isn't refunded. Add-ons are refundable if you cancel. If your baby is unwell, we'll move you to a new date within 60 days. If we cancel, you get a full refund.");
  assert.equal(fillRefundSummary(28000, 10000), REFUND_SUMMARY.replaceAll('{deposit}', '$100').replaceAll('{price}', '$280').replaceAll('{balance}', '$180').replaceAll('{half}', '$90'));
  assert.equal(fillRefundSummary(28000, 10000).includes('$92.50'), false);
  assert.equal(fillDepositAck(), "I understand $100 of my payment is nonrefundable and holds my spot. It can go toward a new session booked within 60 days, for my family or another family I pass it to, as long as the baby meets the age rule (4 weeks to 12 months) on the new date.");
  assert.equal(DEPOSIT_CONFIRM_ERROR, 'Please confirm the nonrefundable $100 before reserving.');
  assert.equal(ageMonthsAtSession('2026-09-01', '2026-12-06'), 3);
  assert.equal(ageMonthsAtSession('2025-12-06', '2026-12-06'), 12);
  assert.equal(ageMonthsAtSession('2026-11-08', '2026-12-06'), 0);
  assert.equal(signingDateLabel(new Date('2026-11-05T02:00:00.000Z')), 'November 4, 2026');
  assert.equal(signingDateLabel(new Date('2026-11-05T05:00:00.000Z')), 'November 5, 2026');
});
test('the pay button stays off until the birth date is valid and every required box is ticked', () => {
  const values = ['age', 'price', 'join', 'checkin', 'contact', 'deposit'];
  const boxes = values.map(value => `<input type="checkbox" name="confirmReady" value="${value}" required/>`).join('') + '<input type="checkbox" name="waiver" required/>';
  const {document: doc} = parseHTML(`<!doctype html><html><body><form id="booking-form"><input name="parentName" value="Alex Parent"/><input id="baby-dob" name="babyDob" type="date"/><span id="baby-dob-error" hidden></span>${boxes}<button class="booking-pay" type="button" disabled aria-disabled="true">Reserve and pay</button></form><div id="second-adult-fields" hidden><input name="secondAdultName" form="booking-form"/><input name="secondAdultEmail" form="booking-form"/></div></body></html>`);
  initBooking(doc);
  const button = doc.querySelector('.booking-pay');
  const dob = doc.querySelector('#baby-dob');
  const today = new Date();
  dob.value = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 40)).toISOString().slice(0, 10);
  dob.dispatchEvent(new doc.defaultView.Event('change'));
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  for (const box of doc.querySelectorAll('input[type=checkbox][required]')) {
    box.checked = true;
    box.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
  }
  assert.equal(button.disabled, false);
  assert.equal(button.getAttribute('aria-disabled'), 'false');
  const deposit = doc.querySelector('[value=deposit]');
  deposit.checked = false;
  deposit.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-disabled'), 'true');
});
test('add-ons are refundable if you cancel, and the old tier sentence is gone', async () => {
  const line = fillRefundSummary();
  const label = "I understand $100 of my payment is nonrefundable and holds my spot. It can go toward a new session booked within 60 days, for my family or another family I pass it to, as long as the baby meets the age rule (4 weeks to 12 months) on the new date.";
  assert.equal(line, "$100 of your $285 payment is nonrefundable and holds your spot. If you cancel 7 or more days before your session, we refund the remaining balance of $185. If you cancel less than 7 days but at least 48 hours before, we refund half of it ($92.50). Within 48 hours, the remaining balance isn't refunded. Add-ons are refundable if you cancel. If your baby is unwell, we'll move you to a new date within 60 days. If we cancel, you get a full refund.");
  assert.equal(line.includes('same timing'), false);
  const book = await documentFor('book/index.html');
  assert.equal(book.querySelector('[data-refund-summary]').textContent, line);
  assert.equal(book.querySelector('[data-deposit-ack]').textContent, label);
  const {document: formDoc} = parseHTML(`<!doctype html><html><body><form id="booking-form"><input id="baby-dob" name="babyDob" type="date" value="2026-09-01"/><input type="checkbox" name="confirmReady" value="deposit" required checked/><p id="deposit-error" hidden></p><button class="booking-pay" type="button"></button></form></body></html>`);
  initBooking(formDoc);
  const box = formDoc.querySelector('[value=deposit]');
  box.required = true;
  box.checked = false;
  box.dispatchEvent(new formDoc.defaultView.Event('change', {bubbles: true}));
  assert.equal(formDoc.querySelector('#deposit-error').textContent, DEPOSIT_CONFIRM_ERROR);
  const faq = await documentFor('faq/index.html');
  assert.equal(faq.body.textContent.includes(line), true);
  const data = JSON.parse(faq.querySelector('script[type="application/ld+json"]').textContent);
  const answer = data['@graph'].find(node => node['@type'] === 'FAQPage').mainEntity.find(item => item.name === 'What is your refund policy?').acceptedAnswer.text;
  assert.equal(answer.includes(line), true);
  assert.equal(answer.includes('same timing'), false);
  const policy = await documentFor('book/policy/index.html');
  assert.equal(policy.body.textContent.includes('It can be used within 60 days by your family or passed to another family, as long as the baby is 4 weeks to 12 months on the new date.'), true);
  assert.equal(policy.body.textContent.includes("can't be transferred to another family"), false);
  assert.equal(book.body.textContent.includes("can't be transferred to another family"), false);
  assert.equal(faq.body.textContent.includes("can't be transferred to another family"), false);
  assert.equal(policy.body.textContent.includes('Add-ons are refundable if you cancel.'), true);
  assert.equal(policy.body.textContent.includes('same timing'), false);
  assert.equal(policy.body.textContent.includes('If your baby is unwell or turned away, add-ons move with the booking, or become store credit if no date works.'), true);
  assert.equal(policy.body.textContent.includes('If Lys Rose cancels, you get a full refund, including the $100.'), true);
  assert.equal(policy.body.textContent.includes('second-adult add-on is not refunded'), false);
  const policySource = await readFile(new URL('../book/policy/index.html', import.meta.url), 'utf8');
  assert.equal(policySource.includes('FLAGGED: awaiting Christy (second-adult refund)'), true);
});
test('checkout charges the full session plus enhancements', () => {
  const {document: doc} = parseHTML(`<!doctype html><html><body><form id="booking-form">
<p id="session-charge"><span id="session-charge-label"></span><span id="session-charge-amount"></span></p>
<p id="face-cream-charge" hidden><span id="face-cream-charge-label"></span><span id="face-cream-charge-amount"></span></p>
<p id="bath-bag-charge" hidden><span id="bath-bag-charge-amount"></span></p>
<p id="second-adult-charge" hidden><span id="second-adult-charge-amount"></span></p>
<strong id="booking-total"></strong>
<input type="radio" name="faceCream" value="signature" checked/>
<input type="radio" name="faceCream" value="premium"/>
<input type="checkbox" name="bathBag"/>
<input type="checkbox" name="secondAdult"/>
<button class="booking-pay" type="button"></button>
</form></body></html>`);
  initBooking(doc);
  assert.equal(doc.getElementById('booking-total').textContent, '$285');
  assert.equal(doc.getElementById('session-charge-label').textContent, 'Session');
  assert.equal(doc.getElementById('session-charge-amount').textContent, '$285');
  const bag = doc.querySelector('[name=bathBag]');
  bag.checked = true;
  bag.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
  assert.equal(doc.getElementById('booking-total').textContent, '$303');
  assert.equal(doc.getElementById('bath-bag-charge').hidden, false);
  const cream = doc.querySelector('[name=faceCream][value=premium]');
  doc.querySelector('[name=faceCream][value=signature]').checked = false;
  cream.checked = true;
  cream.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
  assert.equal(doc.getElementById('booking-total').textContent, '$313');
  assert.equal(doc.getElementById('session-charge-amount').textContent, '$285');
});
test('floral milk soak includes petals unless declined, and BYOB adds them only when chosen', () => {
  const {document: doc} = parseHTML(`<!doctype html><html><body><form id="booking-form">
<input type="radio" name="bath" value="floral-milk-soak"/>
<div id="floral-details" hidden><input type="checkbox" name="petalFree" value="yes"/></div>
<input type="radio" name="bath" value="byob"/>
<div id="byob-details" hidden><input type="checkbox" name="rosePetals" value="yes"/></div>
<p id="petal-line" hidden><span id="petal-line-amount"></span></p>
<strong id="booking-total"></strong>
<button class="booking-pay" type="button"></button>
</form></body></html>`);
  initBooking(doc);
  const floral = doc.querySelector('[name=bath][value=floral-milk-soak]');
  floral.checked = true;
  floral.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
  assert.equal(doc.querySelector('#floral-details').hidden, false);
  assert.equal(doc.querySelector('#byob-details').hidden, true);
  assert.equal(doc.querySelector('#petal-line').hidden, false);
  assert.equal(doc.querySelector('#petal-line-amount').textContent, 'Yes');
  const free = doc.querySelector('[name=petalFree]');
  free.checked = true;
  free.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
  assert.equal(doc.querySelector('#petal-line-amount').textContent, 'No');
  const byob = doc.querySelector('[name=bath][value=byob]');
  floral.checked = false;
  byob.checked = true;
  byob.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
  assert.equal(doc.querySelector('#floral-details').hidden, true);
  assert.equal(doc.querySelector('#byob-details').hidden, false);
  assert.equal(doc.querySelector('[name=petalFree]').checked, false);
  assert.equal(doc.querySelector('#petal-line-amount').textContent, 'No');
  const add = doc.querySelector('[name=rosePetals]');
  add.checked = true;
  add.dispatchEvent(new doc.defaultView.Event('change', {bubbles: true}));
  assert.equal(doc.querySelector('#petal-line-amount').textContent, 'Yes');
});
test('the draft policy page keeps the refund terms and leaves out fees and discretion', async () => {
  const policy = await documentFor('book/policy/index.html');
  assert.equal(policy.querySelector('meta[name=robots]').content, 'noindex,nofollow');
  assert.match(policy.querySelector('.draft-banner').textContent, /Draft/);
  assert.match(policy.querySelector('.draft-banner').textContent, /Not yet in effect/);
  assert.equal(policy.body.textContent.includes(fillRefundSummary()), true);
  const lower = policy.body.textContent.toLowerCase();
  assert.equal(lower.includes('processing fee'), false);
  assert.equal(lower.includes('card fee'), false);
  assert.equal(lower.includes('discretion'), false);
  assert.equal(policy.body.textContent.includes('one-time courtesy'), false);
  assert.match(policy.body.textContent, /Every adult attending \(the booking parent and any second adult\) must sign the Lys Rose waiver before taking part/);
  assert.equal(policy.querySelector('a[href="/book/waiver/read/"]').textContent, 'Read the waiver');
  const waiverPage = await documentFor('book/waiver/index.html');
  assert.equal(waiverPage.querySelector('meta[name=robots]').content, 'noindex,nofollow');
  assert.equal(waiverPage.querySelector('.booking-pay').textContent, 'Sign and continue');
  assert.equal(waiverPage.querySelector('[data-waiver-heading]').textContent, WAIVER_HEADING);
  assert.equal(waiverPage.querySelector('[data-waiver-body]').textContent, WAIVER_RELEASE_TEXT.slice(WAIVER_HEADING.length).trim());
  assert.equal(waiverPage.querySelector('[data-clause-label=emergency]').textContent, 'Emergency.');
  assert.equal(waiverPage.querySelector('[data-clause-body=emergency]').textContent, "If there's an emergency, Lys Rose may call 911. I'm responsible for decisions about my baby's care and for any medical costs. If I can't be reached in an emergency, Lys Rose may contact my emergency contact.");
  assert.equal(waiverPage.querySelector('[data-clause-label=indemnify]'), null);
  assert.equal(waiverPage.querySelector('[data-clause-label=severability]').textContent, 'Severability.');
  assert.equal(waiverPage.querySelector('[data-clause-label=florida]').textContent, 'Florida law.');
  assert.equal(waiverPage.querySelector('[data-clause-label=voluntary]').textContent, 'Voluntary.');
  assert.equal(waiverPage.querySelector('h1').textContent, 'Release and Waiver of Liability');
  assert.equal(waiverPage.querySelector('.waiver-doc-sub').textContent, 'Lys Rose Baby Spa · Waiver, Release and Assumption of Risk');
  assert.equal(waiverPage.querySelector('.waiver-doc-entity').textContent, 'LYS ROSE LLC');
  assert.equal(waiverPage.querySelector('#waiver-part-1'), null);
  assert.equal(waiverPage.querySelector('#parent-emergency legend').textContent, 'Emergency contact');
  assert.equal(waiverPage.querySelector('#adult-emergency legend').textContent.includes('Optional'), true);
  const prose = waiverPage.querySelector('#waiver-prose').innerHTML;
  assert.ok(prose.indexOf('data-clause-label="emergency"') < prose.indexOf('data-florida-notice'));
  assert.ok(prose.indexOf('data-florida-notice') < prose.indexOf('data-clause-label="severability"'));
  assert.ok(prose.indexOf('data-clause-label="severability"') < prose.indexOf('data-clause-label="voluntary"'));
  assert.equal(waiverPage.querySelector('[data-florida-notice]').textContent, FLORIDA_STATUTORY_NOTICE);
  assert.equal(waiverPage.querySelector('[data-waiver-version]').textContent, WAIVER_VERSION_LABEL);
  assert.equal(waiverPage.querySelector('[data-signature-heading]').textContent, SIGNATURE_HEADING);
  assert.equal(waiverPage.querySelector('[data-signature-rest]').textContent, SIGNATURE_LEAD.slice(SIGNATURE_HEADING.length).trim());
  assert.equal(waiverPage.querySelector('[name=esignConsent]').hasAttribute('checked'), false);
  assert.equal(waiverPage.querySelector('[name=esignConsent]').closest('label').textContent, 'I agree to sign and receive these documents electronically. I can ask for a paper copy at any time by emailing hello@lysrosebabyspa.com.');
  assert.equal(waiverPage.querySelector('[name=signatureName]').getAttribute('autocomplete'), 'off');
  assert.equal(waiverPage.querySelector('[name=signatureName]').value, '');
  assert.equal(waiverPage.querySelector('#waiver-confirmation').hasAttribute('hidden'), true);
  assert.equal(waiverPage.querySelector('#signer-adult').hasAttribute('hidden'), true);
  assert.equal(waiverPage.querySelector('#second-signer').hasAttribute('hidden'), true);
  assert.equal(waiverPage.querySelector('.signature-pad') !== null, true);
  assert.equal(waiverPage.querySelector('#waiver-add h3').textContent, 'Add the second adult attending');
  assert.equal(waiverPage.querySelector('#waiver-add-form button').textContent, 'Send their waiver');
  assert.equal(waiverPage.querySelector('[data-parent-sentence]').textContent, PARENT_SIGNATURE_SENTENCE);
  assert.equal(waiverPage.querySelector('[data-adult-18]').textContent, ADULT_18_ACK);
  assert.equal(waiverPage.querySelector('[data-clause-body=a]').textContent, CLAUSE_A.slice('Age and health.'.length).trim());
  assert.equal(waiverPage.querySelector('[data-clause-body=b]').textContent, CLAUSE_B.slice('Products and skipping.'.length).trim());
  assert.equal(waiverPage.querySelector('[data-clause-body=d]').textContent, CLAUSE_D.slice('Sick baby.'.length).trim());
  assert.equal(waiverPage.querySelector('[data-clause-body=petals]').textContent, ROSE_PETAL_CLAUSE.slice('Rose petals.'.length).trim());
  assert.equal(waiverPage.querySelector('[data-waiver-disclaimer]').textContent, WAIVER_DISCLAIMER);
  assert.equal(waiverPage.querySelector('#waiver-clause-c').hasAttribute('hidden'), true);
  assert.equal(MAX_EXTRA_ADULTS, 1);
  const readPage = await documentFor('book/waiver/read/index.html');
  assert.equal(readPage.querySelector('meta[name=robots]').content, 'noindex,nofollow');
  assert.equal(readPage.querySelector('form'), null);
  assert.equal(readPage.querySelector('h1').textContent, 'Release and Waiver of Liability');
  assert.equal(readPage.querySelector('#waiver-document').textContent.includes("[baby's name]"), true);
  assert.equal(readPage.querySelector('[data-clause-body=c]').textContent, CLAUSE_C.slice('Bring your own breastmilk.'.length).trim());
  assert.equal(readPage.querySelector('[data-waiver-body]').textContent, WAIVER_RELEASE_TEXT.slice(WAIVER_HEADING.length).trim());
  assert.equal(readPage.querySelector('[data-florida-notice]').textContent, FLORIDA_STATUTORY_NOTICE);
  assert.equal(readPage.querySelector('[data-waiver-version]').textContent, WAIVER_VERSION_LABEL);
  assert.equal(waiverPage.querySelector('.florida-notice').classList.contains('florida-notice'), true);
  assert.equal(readPage.querySelector('.florida-notice').classList.contains('florida-notice'), true);
  const visibleTerms = page => [...page.querySelectorAll('#waiver-prose > p')].filter(node => !node.hasAttribute('hidden')).map(node => node.textContent.trim()).join('\n\n');
  assert.equal(visibleTerms(waiverPage), renderedWaiverTerms({byob: false}));
  assert.equal(visibleTerms(readPage), renderedWaiverTerms({byob: false}));
  const fixture = await readFile(new URL('./fixtures/waiver-v0.9-part2.txt', import.meta.url), 'utf8');
  assert.equal(renderedWaiverTerms({byob: true}) + '\n', fixture);
  assert.equal(renderedWaiverTerms({byob: true}).includes('PENDING N65'), false);
  assert.equal(renderedWaiverTerms({byob: true}).includes('except the floating petals'), false);
  const css = await readFile(new URL('../assets/site.css', import.meta.url), 'utf8');
  const bodyRule = css.match(/\.waiver-prose > p \{([^}]+)\}/)[1];
  const noticeRule = css.match(/\.waiver-prose > p\.florida-notice \{([^}]+)\}/)[1];
  assert.match(bodyRule, /12pt/);
  assert.match(noticeRule, /font-size:\s*17pt/);
  assert.match(noticeRule, /font-weight:\s*700/);
  assert.match(noticeRule, /border:\s*1px solid/);
  assert.match(noticeRule, /text-transform:\s*uppercase/);
  assert.equal(FLORIDA_NOTICE_FONT_PT, 17);
  assert.equal(WAIVER_BODY_FONT_PT, 12);
  assert.ok(FLORIDA_NOTICE_FONT_PT - WAIVER_BODY_FONT_PT >= 5);
  assert.equal(css.includes('@media') && /florida-notice[\s\S]*font-size:\s*(?!17pt)/.test(css.split('.waiver-prose > p.florida-notice')[1] || ''), false);
  const copy = signedCopyHtml(`Body line\n${FLORIDA_STATUTORY_NOTICE}`);
  assert.match(copy, new RegExp(`font-size:${FLORIDA_NOTICE_FONT_PT}pt`));
  assert.match(copy, /font-weight:700/);
  assert.match(copy, /border:1px solid/);
  assert.match(copy, /text-transform:uppercase/);
  assert.equal(copy.includes(FLORIDA_STATUTORY_NOTICE), true);
  assert.equal(copy.includes('NOTICE TO THE MINOR CHILD'), true);
  assert.equal(BOOKING_TERMS_VERSION, 'waiver-v0.9-2026-11');
  const privacy = await documentFor('privacy/index.html');
  assert.match(privacy.querySelector('.draft-banner').textContent, /Draft/);
  assert.equal(privacy.body.textContent.includes('IP address and browser details when you sign your waiver'), true);
  assert.equal(privacy.body.textContent.includes("If you give us an emergency contact, we collect their name, phone number and relationship to you. We use these only to reach that person if there's an emergency during your session, and we keep them with your signed waiver."), true);
  assert.equal(privacy.body.textContent.includes("We keep signed waivers and their signing records (including the time, IP address and browser details) for as long as they may be needed for any legal claim related to the session, which can be many years. They are not deleted on the 3-year schedule we use for your baby's birth date."), true);
  assert.equal(privacy.body.textContent.includes('Effective date: [effective date]'), true);
  assert.equal(privacy.body.textContent.includes('MAILING'), false);
  assert.equal(privacy.body.textContent.includes('hello@lysrosebabyspa.com'), true);
  assert.equal(privacy.body.textContent.includes("Your baby's birth date. We collect it at booking to confirm your baby meets our age rule (at least 4 weeks old and no older than 12 months on the session date), to plan age-appropriate sessions, and to understand our customers (business analysis, looked at in aggregate). We keep it, together with your booking record, for 3 years after your family's last booking, store it securely with access limited to Lys Rose, and never sell it. After that, we delete the full birth date and keep only your baby's age in months at each session, for business analysis. You can ask us to delete it at any time."), true);
  assert.equal(privacy.body.textContent.includes("Health confirmations. The booking form asks you to tick boxes confirming, for example, that in the 24 hours before the session your baby has had no fever, vomiting or diarrhea. We store only whether each box was ticked (yes/no). We don't collect any health details."), true);
  assert.equal(privacy.body.textContent.includes('We keep waitlist information for up to [24 – TO CONFIRM] months after our last contact with you, or until you ask us to delete it, whichever comes first. We keep records of text-message consent and opt-outs for [4 – TO CONFIRM] years so we can show we respected your choices. Booking and payment records are kept as long as tax and business laws require. Your baby\'s birth date is kept with the booking record for 3 years after your family\'s last booking, unless you ask us to delete it sooner. After that, we keep only your baby\'s age in months at each session.'), true);
  assert.equal(privacy.querySelector('meta[name=robots]').content, 'noindex,nofollow');
});
test('a set robe price replaces the coming soon row with the cutoff note', () => {
  const {document: doc} = parseHTML('<div id="book-addons"><ul class="addon-preview"><li id="robe-addon" data-robe-addon class="is-coming-soon" aria-disabled="true"></li><li id="bath-bag-addon"></li></ul></div>');
  mountRobeAddon(doc, 4500);
  applyRobeCutoff(doc);
  const robe = doc.querySelector('#robe-addon');
  assert.equal(robe.classList.contains('is-coming-soon'), false);
  assert.equal(robe.querySelector('[name=robe]').hasAttribute('disabled'), false);
  assert.equal(robe.querySelector('.addon-price').textContent, '+$45');
  assert.equal(robe.querySelector('#robe-note').textContent, robeNote(''));
  assert.equal(robe.querySelector('#robe-coming-soon'), null);
  assert.equal(doc.querySelector('#bath-bag-addon').previousElementSibling.id, 'robe-addon');
});
test('brand text and hero overlay retain readable contrast',()=>{
  const luminance=rgb=>rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  const ink=[80,75,73];const cream=[255,251,250];const stone=[246,242,239];
  assert.ok(contrast(ink,cream)>=4.5);assert.ok(contrast(ink,stone)>=4.5);
  assert.ok(contrast(ink,cream.map(x=>x*.88))>=4.5);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {site,pages} from '../site.config.mjs';
import {validateFields, interestOptions, limits} from '../assets/validation.js';
import {MIN_AGE_WEEKS, SEATS_PER_SESSION, babyAgeMessage, previewTotal, sessionStatus} from '../assets/booking.js';
const approved = {
  '/': {
    title: 'Lys Rose Baby Spa · Fort Lauderdale',
    description: "A guided session for parents and babies under 12 months: you'll learn infant massage, a warm floral milk bath and simple baby face care. Small group sessions in Fort Lauderdale. Join the waitlist.",
  },
  '/about/': {
    title: 'About · Lys Rose Baby Spa',
    description: "The story behind Lys Rose Baby Spa, named for founder Christy Zemour's daughter.",
  },
  '/services/': {
    title: 'Services · Lys Rose Baby Spa',
    description: "Small group baby spa sessions where you'll learn guided infant massage, a warm floral milk bath and guided baby face care with your own baby, plus light refreshments. Led by caring professionals from the world of babies and new parents. Fort Lauderdale.",
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
  assert.equal(doc.querySelector('.disclaimer').textContent, 'Parents provide all hands-on care for their own baby while our instructor guides. Lys Rose sessions are educational and do not provide medical, physical therapy, midwifery or massage therapy services.');
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
  const items=[...doc.querySelectorAll('.faq-item')];assert.equal(faq.mainEntity.length,items.length);assert.equal(items.length,15);
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
  assert.deepEqual(interestOptions, ['Milk bath', 'Infant massage', 'Guided baby face care', 'The full new parent experience', 'Other']);
  assert.deepEqual([...(await documentFor('index.html')).querySelectorAll('[name=interests]')].map(input => input.getAttribute('value')), interestOptions);
  const read = file => readFile(new URL(file, root), 'utf8');
  const home = await read('index.html');
  const about = await read('about/index.html');
  const services = await read('services/index.html');
  const faq = await read('faq/index.html');
  const all = home + about + services + faq;
  for (const phrase of ['Mini photoshoot', 'À bientôt', 'experienced practitioner', 'Places in each small group are limited.', 'spots']) assert.equal(all.includes(phrase), false, phrase);
  assert.ok(faq.includes('No. Lys Rose sessions are educational and do not provide medical, physical therapy, midwifery or massage therapy services.'));
  assert.ok(about.includes('See you soon'));
  assert.ok(about.includes('White lilies and blush roses, for the lily in the Lys Rose name.'));
  assert.ok(services.includes('Le Petit Rituel'));
  assert.ok(services.includes('Slots are limited. Join the waitlist for early access to session reservations.'));
  assert.ok(home.includes('FORT LAUDERDALE &amp; NEARBY'));
  assert.ok(home.includes('Inspired by Lily Rose.<br>Shared with love.') || home.includes('Inspired by Lily Rose.<br/>Shared with love.'));
  const css = await read('assets/site.css');
  assert.match(css, /\.hero-location\s*\{[^}]*border-top:\s*1px solid #BFA695/);
  assert.doesNotMatch(css, /#B77F1A/);
  assert.doesNotMatch(css, /\.hero-lockup\s*\{[^}]*display:\s*none/);
  const data = JSON.parse((await documentFor('faq/index.html')).querySelector('script[type="application/ld+json"]').textContent);
  const answer = data['@graph'].find(node => node['@type'] === 'FAQPage').mainEntity.find(item => item.name === 'Is this a medical or therapy service?').acceptedAnswer.text;
  assert.equal(answer, 'No. Lys Rose sessions are educational and do not provide medical, physical therapy, midwifery or massage therapy services.');
});
test('booking preview is unlisted, has no seat count, and prices stay off public pages', async () => {
  const book = await documentFor('book/index.html');
  const html = book.documentElement.outerHTML;
  assert.equal(book.querySelector('meta[name=robots]').content, 'noindex,nofollow');
  assert.equal(book.querySelector('script[type="application/ld+json"]'), null);
  assert.equal(book.querySelector('.footer-tagline').textContent, 'Inspired by Lily Rose. Shared with love.');
  assert.equal(book.querySelector('.disclaimer').textContent, 'Parents provide all hands-on care for their own baby while our instructor guides. Lys Rose sessions are educational and do not provide medical, physical therapy, midwifery or massage therapy services.');
  assert.equal(/\b12\s+spots\b/i.test(html), false);
  assert.equal(html.toLowerCase().includes('spots remaining'), false);
  assert.equal(html.toLowerCase().includes('group size'), false);
  assert.equal(/venue/i.test(book.body.textContent), false);
  assert.ok(html.includes('Dates coming soon'));
  assert.ok(html.includes('Available'));
  assert.ok(html.includes('Fully booked'));
  assert.equal(book.querySelector('.booking-price').textContent, '$280 per parent & baby');
  assert.equal(html.includes('$280 per mom'), false);
  assert.ok(html.includes('This is the price before taxes and processing fees.'));
  assert.equal(html.includes('$TBD'), false);
  assert.equal(html.includes('Take-home robe set'), false);
  assert.equal(html.includes('gift bag'), false);
  assert.equal((html.match(/available to add/g) || []).length, 4);
  assert.ok(html.includes('Le Petit Plus (The Little Extras)'));
  assert.equal(html.includes('Premium enhancements'), false);
  assert.equal(html.includes('Optional add-ons'), false);
  assert.equal(html.includes('Photography'), false);
  assert.ok(html.includes('Premium Face Crème'));
  assert.ok(html.includes('Embroidered Keepsake Robe'));
  assert.ok(html.includes('A personalized embroidered robe for your baby.'));
  assert.ok(html.includes('The Lys Rose at Home Kit'));
  assert.ok(html.includes('The at-home baby spa kit.'));
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
  const kit = book.querySelector('.kit-enhancement').textContent;
  assert.ok(kit.includes('Bath soak, toiletry bag & mini face kit: brush, pads, roller.'));
  assert.equal(kit.toLowerCase().includes('massage oil'), false);
  assert.ok(kit.includes('The Grand also includes the baby robe set, with the option to personalize it.'));
  assert.equal(kit.includes('4–6'), false);
  assert.equal(kit.includes('1–2'), false);
  assert.equal(book.querySelectorAll('[name=kitSize][disabled]').length, 2);
  assert.equal(html.toLowerCase().includes('sparkling toast'), false);
  assert.equal(html.toLowerCase().includes('bubbly'), false);
  assert.ok(html.includes('Evereden Nourishing Baby Face Cream. Contains shea butter, coconut, soy and calendula. Please tell us about any allergies at least 48 hours before your session.'));
  assert.equal(html.includes('Full ingredient list below.'), false);
  assert.equal(html.includes('Optional, $10:'), false);
  assert.equal(book.querySelector('.ingredient-list').hasAttribute('open'), false);
  assert.ok(book.querySelector('.ingredient-list summary').textContent.includes('Ingredients:'));
  assert.equal(html.includes('5 g'), false);
  assert.equal(html.toLowerCase().includes('full jar'), false);
  assert.equal(html.includes('$5 or $10'), false);
  assert.equal(html.includes('$5 (a small amount)'), false);
  assert.equal(book.querySelector('[name=faceCareUpgrade]'), null);
  assert.equal(book.querySelector('.jar-option').textContent, '$10');
  assert.ok(html.includes('Water (Aqua), Glycerin, Simmondsia Chinensis (Jojoba) Seed Oil'));
  assert.ok(html.includes("I've read the ingredients and will share any allergies with Lys Rose. [Allergy acknowledgment wording pending review]"));
  assert.equal(book.querySelector('[name=ingredientAck]').hasAttribute('disabled'), true);
  assert.equal(book.querySelector('[name=ingredientAck]').hasAttribute('required'), true);
  assert.equal(book.querySelector('#booking-total').textContent, '$280');
  for (const word of ['hypoallergenic', 'facial', 'soothing']) assert.equal(html.toLowerCase().includes(word), false, word);
  const included = [
    'A 2-hour session for you and your baby, led by a caring expert in babies and new parents',
    'Your own baby bath, soft towels and a cozy station, all set up for you',
    'A floral milk bath with our Floral Milk Soak',
    'Baby massage and face care',
    'Petit cadeau: a little gift',
    'A spa photo op in a soft baby robe set',
    'Refreshments, light bites and fresh florals',
    'An intimate small group',
    'We handle the laundry and cleanup, so you can simply enjoy',
  ];
  for (const line of included) assert.ok(html.includes(line), line);
  const home = await readFile(new URL('index.html', root), 'utf8');
  for (const line of included) assert.ok(home.includes(line), line);
  const bring = "Just your baby, a couple of diapers, a change of clothes and anything you need for feeding (bottle, formula or a nursing cover). We take care of the rest: towels, wipes and everything used during the session.";
  const faqDoc = await documentFor('faq/index.html');
  const faqData = JSON.parse(faqDoc.querySelector('script[type="application/ld+json"]').textContent);
  const faqEntities = faqData['@graph'].find(node => node['@type'] === 'FAQPage').mainEntity;
  const bringAnswer = faqEntities.find(item => item.name === 'What should I bring?').acceptedAnswer.text;
  assert.equal(bringAnswer, bring);
  const includedAnswer = faqEntities.find(item => item.name === "What's included in my session?").acceptedAnswer.text;
  assert.match(includedAnswer, /What's included/);
  assert.ok(includedAnswer.includes('A 2-hour session for you and your baby, with a floral milk bath, baby massage and face care, a spa photo op in a soft baby robe set, refreshments, light bites and fresh florals. We handle the laundry and cleanup, so you can simply enjoy. Petit cadeau: a little gift.'));
  assert.equal(/\bjar\b|face cream/i.test(includedAnswer), false);
  assert.ok(includedAnswer.includes('We handle the laundry and cleanup, so you can simply enjoy.'));
  assert.equal(includedAnswer.toLowerCase().includes('sparkling'), false);
  assert.ok(html.includes('[Waiver wording pending attorney review]'));
  assert.ok(html.includes('Allergies, sensitivities or skin conditions (for example a rash, eczema or broken skin)'));
  assert.ok(book.querySelector('[name=allergies][value=None]'));
  assert.ok(book.querySelector('[name=waiver][required]'));
  assert.equal(book.querySelector('[name=photoRelease]').hasAttribute('checked'), false);
  assert.equal(book.querySelector('[name=photoRelease]').hasAttribute('required'), false);
  assert.equal(book.querySelector('.booking-pay').hasAttribute('disabled'), true);
  assert.equal(html.toLowerCase().includes('stripe'), false);
  assert.equal(html.toLowerCase().includes('square'), false);
  const robots = await readFile(new URL('robots.txt', root), 'utf8');
  assert.match(robots, /Disallow: \/book\//);
  const xml = await readFile(new URL('sitemap.xml', root), 'utf8');
  assert.equal(xml.includes('/book/'), false);
  for (const page of pages) {
    const doc = await documentFor(page.file);
    assert.equal([...doc.querySelectorAll('nav a, header a, footer a')].some(link => (link.getAttribute('href') || '').includes('/book')), false, page.path);
  }
  for (const page of pages.filter(item => item.path !== '/book/')) {
    const text = await readFile(new URL(page.file, root), 'utf8');
    assert.equal(text.includes('$'), false, page.path);
  }
  assert.equal(MIN_AGE_WEEKS, 8);
  assert.equal(sessionStatus(0), 'Available');
  assert.equal(sessionStatus(SEATS_PER_SESSION - 1), 'Available');
  assert.equal(sessionStatus(SEATS_PER_SESSION), 'Fully booked');
  assert.deepEqual(previewTotal(true), {cents:28000, label:'$280', addonPending:true});
  assert.equal(previewTotal(false).addonPending, false);
  const today = new Date(2026, 9, 29);
  assert.equal(babyAgeMessage('2026-09-03', today), '');
  assert.match(babyAgeMessage('2026-09-04', today), /8 weeks/);
  assert.match(babyAgeMessage('2025-10-29', today), /under 12 months/);
  assert.equal(babyAgeMessage('2025-10-30', today), '');
});
test('brand text and hero overlay retain readable contrast',()=>{
  const luminance=rgb=>rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  const ink=[80,75,73];const cream=[255,251,250];const stone=[246,242,239];
  assert.ok(contrast(ink,cream)>=4.5);assert.ok(contrast(ink,stone)>=4.5);
  assert.ok(contrast(ink,cream.map(x=>x*.88))>=4.5);
});

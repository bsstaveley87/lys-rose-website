import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {site,pages} from '../site.config.mjs';
import {validateFields, interestOptions, limits} from '../assets/validation.js';
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
    description: "Small group baby spa sessions where you'll learn guided infant massage, a warm floral milk bath and guided baby face care with your own baby, plus light refreshments. Guided by caring professionals from the world of babies and new parents. Fort Lauderdale.",
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
for(const page of pages) test(`${page.path}: indexable HTML, SEO, structured data, assets and links`,async()=>{
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
  assert.equal(doc.querySelector('.disclaimer').textContent, 'Lys Rose sessions are educational and do not provide medical, physical therapy, midwifery or massage therapy services.');
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
  for(const page of pages)assert.ok(xml.includes(`<loc>${site.origin+page.path}</loc>`));
  assert.equal((xml.match(/<url>/g)||[]).length,pages.length);
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
  const instructor = 'Every Lys Rose session is guided by a caring professional from the world of babies and new parents, whose backgrounds may include pediatric or pelvic floor physical therapy, doula work, midwifery or infant massage instruction. All are CPR certified and chosen for their calm, nurturing way with families. They guide each step, and you share it hand in hand with your baby.';
  for (const page of [about, services, faq]) {
    assert.ok(page.includes(instructor));
    assert.equal(page.includes('led by'), false);
    assert.equal(page.includes('They lead each step'), false);
  }
  assert.ok(services.includes("WHO LEADS IT"));
  assert.ok(faq.includes('Who leads the session?'));
  assert.ok(services.includes("With our instructor guiding you, you'll apply a fragrance-free baby face cream to your baby's face yourself. We show each step; the hands-on care is always yours."));
  assert.equal(services.includes('gently moisturize'), false);
  const robeAddOn = 'A fresh robe set to take home is available as an optional add-on.';
  assert.ok(services.includes('Soft robes in 0–6M and 6–9M sizes, and hooded towels for babies 9 months and up, to wear during your session. ' + robeAddOn));
  assert.ok(services.includes('A robe and hooded towels are provided to wear during your session.'));
  assert.ok(faq.includes('A robe and hooded towels to wear during your session, and a soft baby brush (cleaned and sanitized after every use), are provided. ' + robeAddOn));
  assert.ok(faq.includes('A robe (0–6M and 6–9M) and hooded towels (9M and up) are provided to wear during your session, and light refreshments are included.'));
  const allergy = "When you book, please tell us about any allergies or sensitivities, anything in the products we use during your session you'd like us to avoid, and whether your baby has a skin condition such as a rash, eczema or broken skin. We'll set up your bath without that ingredient, and on the day we can always offer a plain warm-water bath. If you're unsure about anything, please check with your pediatrician before your session.";
  assert.ok(faq.includes('What if my baby or I have an allergy or sensitive skin?'));
  assert.ok(faq.includes(allergy));
  assert.equal(faq.includes('48 hours'), false);
  const data = JSON.parse((await documentFor('faq/index.html')).querySelector('script[type="application/ld+json"]').textContent);
  const faqPage = data['@graph'].find(node => node['@type'] === 'FAQPage');
  const answer = faqPage.mainEntity.find(item => item.name === 'Is this a medical or therapy service?').acceptedAnswer.text;
  assert.equal(answer, 'No. Lys Rose sessions are educational and do not provide medical, physical therapy, midwifery or massage therapy services.');
  const allergyAnswer = faqPage.mainEntity.find(item => item.name === 'What if my baby or I have an allergy or sensitive skin?').acceptedAnswer.text;
  assert.equal(allergyAnswer, allergy);
  const includedAnswer = faqPage.mainEntity.find(item => item.name === "What's included in a session?").acceptedAnswer.text;
  assert.ok(includedAnswer.endsWith(robeAddOn));
  const bringAnswer = faqPage.mainEntity.find(item => item.name === 'What should I bring?').acceptedAnswer.text;
  assert.ok(bringAnswer.includes('to wear during your session'));
  assert.equal(bringAnswer.includes(robeAddOn), false);
});
test('brand text and hero overlay retain readable contrast',()=>{
  const luminance=rgb=>rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  const ink=[80,75,73];const cream=[255,251,250];const stone=[246,242,239];
  assert.ok(contrast(ink,cream)>=4.5);assert.ok(contrast(ink,stone)>=4.5);
  assert.ok(contrast(ink,cream.map(x=>x*.88))>=4.5);
});

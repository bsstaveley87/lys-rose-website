import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {site,pages} from '../site.config.mjs';
const root=new URL('../',import.meta.url);
const output=new URL('_site/',root);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,12);
await rm(output,{recursive:true,force:true}); await mkdir(output,{recursive:true});
for(const path of ['CNAME','.nojekyll','assets']) await cp(new URL(path,root),new URL(path,output),{recursive:true});
const css=await readFile(new URL('assets/reference.css',root),'utf8')+'\n'+await readFile(new URL('assets/site.css',root),'utf8');
const validation=await readFile(new URL('assets/validation.js',root),'utf8');
const validationName=`validation.${hash(validation)}.js`;
const js=(await readFile(new URL('assets/site.js',root),'utf8')).replace("'./validation.js'",`'./${validationName}'`);
const scriptName=`site.${hash(js)}.js`; const styleName=`site.${hash(css)}.css`;
await Promise.all([
  writeFile(new URL('assets/'+validationName,output),validation),
  writeFile(new URL('assets/'+scriptName,output),js),
  writeFile(new URL('assets/'+styleName,output),css),
  // Stable alias is also used by the Worker's non-JavaScript confirmation page.
  writeFile(new URL('assets/site.css',output),css),
]);
function structuredData(page,document) {
  const businessId=site.origin+'/#organization'; const websiteId=site.origin+'/#website'; const url=site.origin+page.path;
  const graph=[
    {'@type':'Organization','@id':businessId,name:site.name,url:site.origin+'/',email:site.email,founder:{'@type':'Person',name:'Christy Zemour'},logo:{'@type':'ImageObject',url:site.origin+'/assets/logo/lysrose-emblem.png'},sameAs:[site.instagram],areaServed:{'@type':'City',name:'Fort Lauderdale'}},
    {'@type':'WebSite','@id':websiteId,name:site.name,url:site.origin+'/',publisher:{'@id':businessId},inLanguage:'en-US'},
    {'@type':page.path==='/about/'?'AboutPage':page.path==='/contact/'?'ContactPage':page.path==='/faq/'?'FAQPage':'WebPage','@id':url+'#webpage',url,name:page.title,description:page.description,isPartOf:{'@id':websiteId},about:{'@id':businessId},inLanguage:'en-US',primaryImageOfPage:{'@type':'ImageObject',url:site.origin+site.image,width:1200,height:630}},
  ];
  if(page.path!=='/') graph.push({'@type':'BreadcrumbList','@id':url+'#breadcrumbs',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:site.origin+'/'},{'@type':'ListItem',position:2,name:page.name,item:url}]});
  if(page.path==='/services/') graph.push({'@type':'Service','@id':site.origin+'/#sessions',name:'Lys Rose parent and baby spa sessions',serviceType:'Educational parent and baby sessions',provider:{'@id':businessId},areaServed:{'@type':'City',name:'Fort Lauderdale'},url,description:page.description});
  if(page.path==='/faq/') {
    const questions=[...document.querySelectorAll('.faq-item')].map(item=>({
      '@type':'Question',name:item.querySelector('summary').textContent.replace(/\+\s*$/,'').trim(),
      acceptedAnswer:{'@type':'Answer',text:[...item.querySelectorAll('p')].map(p=>p.textContent.trim()).join('\n\n')},
    }));
    graph.find(node=>node['@id']===url+'#webpage').mainEntity=questions;
  }
  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
}
function head(page,document,noindex=false) {
  const title=escape(page.title); const description=escape(page.description); const url=site.origin+page.path;
  const robots=page.robots || (noindex?'noindex,follow':'index,follow,max-image-preview:large');
  const unlisted=robots.startsWith('noindex');
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#FFFBFA">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/logo/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/logo/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&amp;family=Jost:wght@400;500&amp;display=swap">
<link rel="stylesheet" href="/assets/${styleName}">
<meta property="og:site_name" content="${site.name}">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.origin+site.image}">
<meta property="og:image:secure_url" content="${site.origin+site.image}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(site.imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${site.origin+site.image}">
<meta name="twitter:image:alt" content="${escape(site.imageAlt)}">
${unlisted?'':`<script type="application/ld+json">${structuredData(page,document)}</script>`}
<script type="module" src="/assets/${scriptName}"></script>`;
}
// Use the homepage's header, menu, fallback navigation and footer as shared components.
const sharedSource=parseHTML(await readFile(new URL('index.html',root),'utf8')).document;
const sharedSelectors=['header','header + noscript','#site-menu','footer'];
const sharedComponents=sharedSelectors.map(selector=>{
  const component=sharedSource.querySelector(selector).cloneNode(true);
  for(const node of component.querySelectorAll('[href],[src]')) for(const attribute of ['href','src']) {
    const value=node.getAttribute(attribute); if(!value || /^(https?:|mailto:|#)/.test(value)) continue;
    const url=new URL(value,site.origin+'/'); node.setAttribute(attribute,url.pathname+url.search+url.hash);
  }
  return [selector,component.outerHTML];
});
for(const page of pages) {
  const {document}=parseHTML(await readFile(new URL(page.file,root),'utf8'));
  for(const [selector,html] of sharedComponents) {
    const target=document.querySelector(selector); if(target) target.outerHTML=html;
  }
  document.documentElement.lang='en';
  document.head.innerHTML=head(page,document);
  for(const link of document.querySelectorAll('nav a')) {
    if(new URL(link.getAttribute('href'),site.origin+page.path).pathname===page.path) link.setAttribute('aria-current','page');
  }
  if(page.path!=='/' && !document.querySelector('.breadcrumbs')) {
    const crumb=document.createElement('nav'); crumb.className='breadcrumbs'; crumb.setAttribute('aria-label','Breadcrumb');
    crumb.innerHTML=`<a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">${escape(page.name)}</span>`;
    document.querySelector('.page-heading .editorial-wrap').prepend(crumb);
  }
  await mkdir(new URL(page.file.substring(0,page.file.lastIndexOf('/')+1),output),{recursive:true});
  await writeFile(new URL(page.file,output),'<!doctype html>\n'+document.documentElement.outerHTML+'\n');
}
const {document:notFound}=parseHTML(await readFile(new URL('404.html',root),'utf8'));
notFound.head.innerHTML=head({path:'/404.html',title:'Page Not Found | Lys Rose Baby Spa',description:'This page could not be found. Return to Lys Rose Baby Spa in Fort Lauderdale.'},notFound,true);
await writeFile(new URL('404.html',output),'<!doctype html>\n'+notFound.documentElement.outerHTML+'\n');
await writeFile(new URL('robots.txt',output),`User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`);
const indexed=pages.filter(page=>!(page.robots||'').startsWith('noindex'));
await writeFile(new URL('sitemap.xml',output),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+indexed.map(page=>`<url><loc>${site.origin+page.path}</loc></url>`).join('')+'</urlset>\n');
console.log(`Built ${pages.length} pages, page-specific metadata and structured data, and versioned assets.`);

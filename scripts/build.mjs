import {cp,mkdir,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const output=new URL('_site/',root);
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const path of ['index.html','404.html','CNAME','.nojekyll','robots.txt','sitemap.xml','assets','about','services','faq','contact'])await cp(new URL(path,root),new URL(path,output),{recursive:true});
console.log('Built GitHub Pages site in _site/');

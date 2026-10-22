import {mkdir,cp} from 'node:fs/promises';
const root=new URL('../',import.meta.url);const audit=new URL('_site/__audit__/',root);
await mkdir(audit,{recursive:true});
await cp(new URL('tests/responsive-audit.html',root),new URL('index.html',audit));
await cp(new URL('tests/accessibility-audit.html',root),new URL('accessibility.html',audit));
await cp(new URL('node_modules/axe-core/axe.min.js',root),new URL('axe.min.js',audit));
console.log('Local-only audit tools prepared. Serve _site and open /__audit__/ or /__audit__/accessibility.html. A normal build excludes these tools.');

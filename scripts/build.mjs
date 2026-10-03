import {readFile,writeFile} from 'node:fs/promises';
import {Script} from 'node:vm';
const root=new URL('../',import.meta.url);
const model=await readFile(new URL('src/catalog.mjs',root),'utf8');
const ui=await readFile(new URL('src/ui.mjs',root),'utf8');
const output="(()=>{'use strict';\n"+model.replace(/^export /gm,'')+'\n'+ui.replace(/^import .*;\r?\n/m,'')+'\n})();\n';
new Script(output);await writeFile(new URL('dist/addon.js',root),output);

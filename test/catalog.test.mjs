import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {publicUrl,validateIndex,search,boundedJson,validateRecord} from '../src/catalog.mjs';
const root=new URL('../',import.meta.url);
const data=validateIndex(JSON.parse(await readFile(new URL('data/index.json',root),'utf8')));
test('collection complète, identifiants uniques et références publiques cohérentes',async()=>{
  assert.equal(data.entries.filter(e=>e.kind==='product').length,690);assert.equal(data.summary.shared_recipes,70);
  const ids=new Set(data.entries.map(e=>e.id));let recipes=0;
  for(const file of new Set(data.entries.map(e=>e.file))){
    const records=JSON.parse(await readFile(new URL(file,root),'utf8'));
    for(const r of records){const entry=data.entries.find(e=>e.id===r.id);assert.ok(entry);validateRecord(r,entry);assert.equal(r.license,'CC-BY-SA-4.0');assert.ok(publicUrl(r.license_url));
      if(r.kind==='recipe'){recipes++;for(const i of r.ingredients)if(typeof i==='object'&&i.product)assert.ok(ids.has(i.product));for(const s of r.subrecipes||[])assert.ok(ids.has(s.recipe));
        if(r.origin==='wikibooks'){assert.ok(publicUrl(r.source));assert.ok(publicUrl(r.source_revision));assert.ok(publicUrl(r.contributors));assert.ok(r.source_text);}
        else {assert.deepEqual(r.instructions,[]);assert.equal(r.source_text,undefined);}
      }else if(r.parent)assert.ok(ids.has(r.parent));
    }
  }
  assert.equal(recipes,data.summary.recipes);
});
test('fiches partagées : liste fermée, aucun achat, stock, prescription ou identifiant Grocy',async()=>{
  const products=JSON.parse(await readFile(new URL('data/products.json',root),'utf8'));
  const fields=new Set('id kind name brand sub_brand barcodes stock_unit purchase_unit parent source reference_price nutrition origin status license license_url'.split(' '));
  for(const p of products){assert.ok(Object.keys(p).every(k=>fields.has(k)));assert.match(p.id,/^p-[a-f0-9]{20}$/);assert.ok(!('description' in p));
    if(p.reference_price){assert.equal(p.reference_price.status,'historical-unreverified');assert.ok(publicUrl(p.reference_price.source));assert.ok(p.reference_price.observed_at);assert.ok(p.reference_price.amount>0);assert.ok(!('store' in p.reference_price));}
  }
  assert.equal(products.filter(p=>p.reference_price).length,data.summary.historical_reference_prices);
  assert.ok(products.some(p=>p.reference_price===null));
});
test('recherche accents, filtres, langue et méthode disponible',()=>{
  assert.ok(search(data.entries,{query:'chocolat',language:'fr',kind:'recipe'}).length>0);
  assert.ok(search(data.entries,{query:'pates',kind:'product'}).length>0);
  assert.ok(search(data.entries,{full:true}).every(e=>e.kind==='recipe'&&e.availability==='text'));
  assert.ok(search(data.entries,{origin:'shared-facts'}).every(e=>e.origin==='shared-facts'));
});
test('index refuse traversée, URL distante et doublon',()=>{
  for(const file of ['../secret.json','https://attacker.invalid/x','data/recipes-001.json?x=1','data/recipes-%2e%2e.json'])assert.throws(()=>validateIndex({...data,entries:[{...data.entries[0],file}]}));
  assert.throws(()=>validateIndex({...data,entries:[data.entries[0],data.entries[0]]}));
});
test('liens refusent exécution, credentials et protocole non sécurisé',()=>{
  for(const value of ['javascript:alert(1)','data:text/html,x','https://user:password@example.org/x','http://example.org','https://example.org:666/x'])assert.equal(publicUrl(value),null);
  assert.equal(publicUrl('https://en.wikibooks.org/wiki/Cookbook:Aligot'),'https://en.wikibooks.org/wiki/Cookbook:Aligot');
});
test('identité de fiche contrôlée',()=>assert.throws(()=>validateRecord({id:'wrong',kind:'recipe',name:data.entries[0].name,ingredients:[]},data.entries[0])));
test('réponses publiques bornées même sans Content-Length',async()=>{
  let options;
  const mock=async(_,o)=>{options=o;return new Response(' '.repeat(100),{headers:{'Content-Type':'application/json'}});};
  await assert.rejects(boundedJson('https://example.org',{fetchImpl:mock,maxBytes:20}),/volumineux/);
  assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,undefined);
});
test('JSON invalide refusé et statut amont signalé',async()=>{
  await assert.rejects(boundedJson('x',{fetchImpl:async()=>new Response('{')}));
  await assert.rejects(boundedJson('x',{fetchImpl:async()=>new Response('',{status:503})}),/503/);
});

(()=>{'use strict';
/* SPDX-License-Identifier: GPL-3.0-or-later */
function publicUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return null;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') ? u.href : null; } catch { return null; }
}
function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim(); }
function validateIndex(data) {
  if (data?.schema !== 1 || !Array.isArray(data.entries) || data.entries.length > 20000 || !data.summary) throw new Error('Catalogue invalide');
  const ids = new Set();
  for (const e of data.entries) {
    if (!e || !/^[a-z0-9-]{1,80}$/.test(e.id) || ids.has(e.id) || !['recipe','product'].includes(e.kind) || typeof e.name !== 'string' || e.name.length > 500 || !/^data\/(products|recipes-\d{3})\.json$/.test(e.file) || !['fr','en'].includes(e.language) || !Array.isArray(e.tags) || e.tags.some(t => typeof t !== 'string' || t.length > 300)) throw new Error('Entrée de catalogue invalide');
    ids.add(e.id);
  }
  return data;
}
const normalizedEntries = new WeakMap();
function search(entries, { query = '', kind = '', language = '', origin = '', full = false } = {}) {
  const words = normalize(query).slice(0, 300).split(/\s+/).filter(Boolean);
  return entries.filter(e => {
    if ((kind && e.kind !== kind) || (language && e.language !== language) || (origin && e.origin !== origin) || (full && e.availability !== 'text')) return false;
    if (!normalizedEntries.has(e)) normalizedEntries.set(e, normalize(e.name + ' ' + e.tags.join(' ') + ' ' + String(e.search_terms || '').slice(0,30000)));
    return words.every(word => normalizedEntries.get(e).includes(word));
  });
}
async function boundedJson(url, {fetchImpl = fetch, maxBytes = 8 * 1024 * 1024} = {}) {
  const response = await fetchImpl(url, { credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Catalogue indisponible (' + response.status + ')');
  if (Number(response.headers.get('Content-Length')) > maxBytes) throw new Error('Fichier trop volumineux');
  const reader = response.body.getReader(); const chunks = []; let size = 0;
  try {
    for (;;) { const {done, value} = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) throw new Error('Fichier trop volumineux'); chunks.push(value); }
  } catch (e) { await reader.cancel(); throw e; }
  const data = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(data));
}
function validateRecord(record, entry) {
  if (record?.id !== entry.id || record.kind !== entry.kind || record.name !== entry.name || !Array.isArray(record.kind === 'recipe' ? record.ingredients : record.barcodes)) throw new Error('Fiche incohérente');
  return record;
}

/* SPDX-License-Identifier: GPL-3.0-or-later */
function installRecipeImport(sdk){
  const client=sdk.scope('public-catalog');
  const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=String(text);if(cls)n.className=cls;return n;};
  const button=(label,fn,cls='secondary')=>{const b=make('button',label,'btn btn-'+cls);b.type='button';b.onclick=fn;return b;};
  async function preview(id,revision){
    const dialog=make('dialog',null,'gr-import-dialog');dialog.setAttribute('aria-labelledby','gr-import-title');
    const head=make('header',null,'gr-import-head'),title=make('h2','Ajouter une recette');title.id='gr-import-title';
    const close=button('×',()=>dialog.close(),'light');close.setAttribute('aria-label','Fermer');head.append(make('span','RECETTES PARTAGÉES','gr-import-eyebrow'),title,close);
    const body=make('div',null,'gr-import-body'),foot=make('footer',null,'gr-import-foot');
    dialog.append(head,body,foot);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();body.append(make('p','Préparation de la recette…','gr-import-muted'));
    let job,confirm,working=false;
    const cancel=button('Annuler',()=>dialog.close());
    async function load(servings){
      try{
        job=await client.runtime('catalog.recipe.prepare',{id,revision,...(servings==null?{}:{servings})});
        if(!dialog.isConnected)return;const c=job.record.content;body.replaceChildren(make('h3',c.name));
        const badges=make('div',null,'gr-import-badges');badges.append(make('span',c.base_servings?c.base_servings+' portions':'Portions à préciser'),make('span','Version '+job.record.revision),make('span',c.license||'Source conservée'));body.append(badges);
        const notice=make('p','La fiche sera ajoutée à vos recettes avec ses ingrédients, ses étapes et ses sources. Les ingrédients restent dans le texte de préparation ; ils ne sont pas encore associés à vos produits. Aucun stock ni achat ne sera créé.','gr-import-notice');body.append(notice);
        if(job.needsServings){const label=make('label','Nombre de portions','gr-import-portions'),input=make('input');input.type='number';input.min='.01';input.max='1000';input.step='any';input.required=true;label.append(input);body.append(label);foot.replaceChildren(cancel,button('Prévisualiser',()=>{const n=Number(input.value);if(input.reportValidity()&&n>0)load(n);},'primary'));return;}
        const columns=make('div',null,'gr-import-columns'),ingredients=make('section'),steps=make('section');ingredients.append(make('h4','Ingrédients'));const ul=make('ul');for(const v of c.ingredients||[])ul.append(make('li',typeof v==='string'?v:v.variable ? v.variable+' — '+(v.name||'') : [v.quantity??'Quantité non précisée',v.unit||'',v.name||''].join(' ')));ingredients.append(ul);steps.append(make('h4','Préparation'));const ol=make('ol');for(const v of c.instructions||[])ol.append(make('li',typeof v==='string'?v:v.text));steps.append(ol);if(!c.instructions?.length)steps.append(make('p','La méthode complète reste disponible à la source. Cette fiche conserve son lien.','gr-import-muted'));columns.append(ingredients,steps);body.append(columns);
        if(c.unresolved_markup||c.subrecipes?.length)body.append(make('p','Cette fiche contient des modèles ou des sous-recettes à relire à la source.','gr-import-notice'));
        if(c.source){try{const u=new URL(c.source);if(u.protocol==='https:'&&!u.username&&!u.password){const a=make('a','Consulter la source');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}}catch{}}
        confirm=button('Ajouter la recette',async()=>{
          if(working)return;working=true;confirm.disabled=true;cancel.disabled=true;dialog.oncancel=e=>e.preventDefault();confirm.textContent='Ajout en cours…';
          try{const result=await client.runtime('catalog.recipe.confirm',{jobId:job.jobId,approvalHash:job.approvalHash});
            if(result.state==='complete'){body.replaceChildren(make('div','✓','gr-import-success'),make('h3',result.reused?'Cette recette est déjà dans Grocy':'La recette est ajoutée'),make('p','Vous pouvez la retrouver dans vos recettes et adapter sa préparation.','gr-import-muted'));const a=make('a','Ouvrir la recette','btn btn-primary');const target=new URL(location.href);target.pathname=target.pathname.replace(/\/recipes\/?$/,'/recipe');target.search='id='+encodeURIComponent(result.recipeId);a.href=target.href;foot.replaceChildren(button('Fermer',()=>dialog.close()),a);}
            else{body.append(make('p',result.message,'gr-import-error'));confirm.textContent='Vérifier le résultat';confirm.disabled=false;}
          }catch(e){body.append(make('p',e.message||'Ajout interrompu. Vérifiez le résultat avant de poursuivre.','gr-import-error'));confirm.textContent='Vérifier le résultat';confirm.disabled=false;}
          finally{working=false;cancel.disabled=false;dialog.oncancel=null;}
        },'primary');foot.replaceChildren(cancel,confirm);
      }catch(e){body.replaceChildren(make('h3','La recette ne peut pas être ajoutée'),make('p',e.message||'Connectez-vous à Grocy puis réessayez.','gr-import-error'));foot.replaceChildren(button('Fermer',()=>dialog.close()));}
    }
    await load();
  }
  const params=new URLSearchParams(location.search),id=params.get('grocyste_recipe'),revision=Number(params.get('grocyste_revision'));
  if(id&&/^(?:r|w)-[a-zA-Z0-9_-]{1,80}$/.test(id)&&Number.isSafeInteger(revision)&&revision>0){params.delete('grocyste_recipe');params.delete('grocyste_revision');history.replaceState({},'',location.pathname+(params.size?'?'+params:'')+location.hash);preview(id,revision);}
  const anchor=document.querySelector('a[href$="/recipes"]');
  if(anchor){const a=make('a','Recettes partagées',anchor.className);a.href='https://grocyste.banane.fun/?kind=recipe';a.target='_blank';a.rel='noopener noreferrer';anchor.parentNode.append(a);}
}

function publicRecipeImport(id,revision=1){
  const dialog=document.createElement('dialog');dialog.className='gr-import-dialog';dialog.setAttribute('aria-label','Ajouter à votre Grocy');
  const h=document.createElement('h2');h.textContent='Ajouter à votre Grocy';const p=document.createElement('p');p.textContent='Une nouvelle fenêtre ouvrira votre Grocy pour prévisualiser la recette, puis confirmer son ajout.';
  const label=document.createElement('label');label.textContent='Adresse de votre Grocy';const input=document.createElement('input');input.type='url';input.placeholder='https://votre-grocy.fr';input.required=true;try{input.value=localStorage.getItem('grocyste-grocy-url')||'';}catch{}label.append(input);
  const actions=document.createElement('footer');actions.className='gr-import-foot';const cancel=document.createElement('button');cancel.textContent='Annuler';cancel.onclick=()=>dialog.close();const add=document.createElement('a');add.textContent='Ouvrir la confirmation';add.className='gr-import-primary';
  const update=()=>{try{const u=new URL(input.value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw Error();u.pathname=u.pathname.replace(/\/$/,'')+'/recipes';u.search=new URLSearchParams({grocyste_recipe:id,grocyste_revision:String(revision)});add.href=u.href;add.target='_blank';add.rel='noopener noreferrer';add.removeAttribute('aria-disabled');}catch{add.removeAttribute('href');add.setAttribute('aria-disabled','true');}};
  input.oninput=update;add.onclick=e=>{if(!add.href){e.preventDefault();input.reportValidity();return;}try{localStorage.setItem('grocyste-grocy-url',input.value.replace(/\/$/,''));}catch{}dialog.close();};update();actions.append(cancel,add);dialog.append(h,p,label,actions);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();input.focus();
}

/* SPDX-License-Identifier: GPL-3.0-or-later */
const currentScript = document.currentScript;
const sdk = window.Grocyste;
const asset = path => sdk ? sdk.assetUrl('public-catalog', path) : new URL('../' + path, currentScript.src).href;
function element(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = String(text); if (className) e.className = className; return e; }
function link(label, target) { const a = element('a', label); const safe = publicUrl(target); if (safe) { a.href = safe; a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a; }
function download(label, name, data) {
  const button = element('button', label); button.type = 'button';
  button.onclick = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})); const a = element('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }; return button;
}
async function mount(host) {
  host.classList.add('gcatalog');
  const title = element('h1', 'Grocyste — Catalogue public');
  const intro = element('p', 'Recettes libres et fiches produits partagées. Recherche, lecture et téléchargement sans compte.');
  const summary = element('p', 'Chargement…'); summary.setAttribute('role','status');
  const controls = element('form'); controls.setAttribute('role','search'); controls.onsubmit = e => e.preventDefault();
  const input = element('input'); input.type = 'search'; input.placeholder = 'Plat, produit, ingrédient, code-barres…'; input.setAttribute('aria-label','Recherche'); input.maxLength = 300;
  function select(label, options) { const wrap = element('label',label+' '), field=element('select'); for (const [v,t] of options) { const o=element('option',t);o.value=v;field.append(o); } wrap.append(field);controls.append(wrap);return field; }
  controls.append(input);
  const kind=select('Afficher',[['','Tout'],['recipe','Recettes'],['product','Produits']]);
  const language=select('Langue',[['','Toutes'],['fr','Français'],['en','Anglais']]);
  const origin=select('Collection',[['','Toutes'],['wikibooks','Wikilivres'],['shared-facts','Fiches partagées']]);
  const check=element('input');check.type='checkbox';const full=element('label','Avec ingrédients et méthode libre ');full.append(check);controls.append(full);
  const status=element('p');status.setAttribute('role','status');
  const results=element('div',undefined,'gc-grid'),navigation=element('nav'),details=element('section',undefined,'gc-details');details.setAttribute('aria-label','Fiche sélectionnée');details.tabIndex=-1;
  const notices=element('p','Les recettes communautaires ne sont pas testées en cuisine. Les unités d’origine sont conservées. Les prix sont des observations anciennes à revalider. Les descriptions commerciales, photos, stocks, achats et données de compte ne sont pas publiés.', 'gc-notice');
  host.append(title,intro,summary,controls,status,details,results,navigation,notices);
  const data=validateIndex(await boundedJson(asset('data/index.json')));let page=0,current=[],request=0;const cache=new Map();
  summary.textContent=`${data.summary.recipes.toLocaleString('fr')} recettes · ${data.summary.products} produits · ${data.summary.historical_reference_prices} prix de référence datés`;
  const downloads=element('p');const all=element('a','Télécharger la collection complète et le paquet signé');all.href='https://github.com/Raph563/Grocyste-Catalog/releases/latest';all.rel='noopener noreferrer';all.target='_blank';downloads.append(all,' · ',link('Licence des textes et données','https://creativecommons.org/licenses/by-sa/4.0/'));host.insertBefore(downloads,controls);
  function list(title,values) { if(!values?.length)return; details.append(element('h3',title));const ul=element('ul');for(const v of values)ul.append(element('li',typeof v==='string'?v:JSON.stringify(v)));details.append(ul); }
  async function open(entry) {
    const ticket=++request; details.replaceChildren(element('p','Chargement de la fiche…'));
    try {
      if(!cache.has(entry.file)) { if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(entry.file,boundedJson(asset(entry.file)).catch(e=>{cache.delete(entry.file);throw e;})); }
      const chunk=await cache.get(entry.file);if(!Array.isArray(chunk)||chunk.length>1000)throw new Error('Fichier de fiches invalide');
      const record=validateRecord(chunk.find(r=>r.id===entry.id),entry);if(ticket!==request)return;
      history.replaceState(null,'','#'+entry.id);
      details.replaceChildren();const close=element('button','Fermer la fiche');close.type='button';close.onclick=()=>{++request;details.replaceChildren();history.replaceState(null,'',location.pathname+location.search);};details.append(close,element('h2',record.name));
      if(record.kind==='recipe') {
        if(record.base_servings)details.append(element('p',`${record.base_servings} portions de référence`));
        list('Ingrédients',record.ingredients.map(i=>typeof i==='string'?i:`${i.quantity??'Quantité inconnue'} ${i.unit||'unité inconnue'} · ${i.name}${i.group?' ('+i.group+')':''}${i.variable?' · '+i.variable:''}`));
        list('Préparation',record.instructions);list('Notes et attribution complémentaire',record.notes);
        if(record.subrecipes?.length) { details.append(element('h3','Sous-recettes'));for(const sub of record.subrecipes){const e=data.entries.find(e=>e.id===sub.recipe);if(e){const b=element('button',`${e.name} · ${sub.servings??'?' } portions`);b.type='button';b.onclick=()=>open(e);details.append(b);}} }
        if(record.unresolved_markup)details.append(element('p','Certains modèles wiki restent visibles. Relire la révision source pour leur affichage complet.'));
        if(record.availability!=='text')details.append(element('p','Méthode non redistribuée ou extraction incomplète : consulter la source.'));
      } else {
        details.append(element('p',`Marque : ${record.brand||'inconnue'} · Unité de stock : ${record.stock_unit||'inconnue'} · Unité d’achat : ${record.purchase_unit||'inconnue'}`));
        list('Codes-barres enregistrés',record.barcodes);
        if(record.nutrition)details.append(element('p',`${record.nutrition.energy_kcal} kcal pour ${record.nutrition.basis_amount} ${record.nutrition.basis_unit||'unité inconnue'} — référence ancienne à relire`));
        if(record.reference_price){const p=record.reference_price;details.append(element('p',`${p.amount.toLocaleString('fr',{minimumFractionDigits:2})} € pour ${p.package_quantity} ${p.package_unit||'unité inconnue'} · observation ${p.observed_at}. ${p.scope}`));}
        else details.append(element('p','Prix de référence inconnu.'));
        details.append(element('p',record.status));
        if(record.parent){const parent=data.entries.find(e=>e.id===record.parent);if(parent){const b=element('button','Famille : '+parent.name);b.type='button';b.onclick=()=>open(parent);details.append(b);}}
      }
      if(record.source_text){const original=element('details');original.append(element('summary','Texte source et attributions (mise en forme simplifiée)'),element('p',record.source_text));details.append(original);}
      const sources=element('p');if(record.source)sources.append(link('Source',record.source),' · ');if(record.source_revision)sources.append(link('Révision utilisée',record.source_revision),' · ');if(record.contributors)sources.append(link('Contributeurs',record.contributors),' · ');sources.append(link(record.license,record.license_url));details.append(sources);
      if(record.modifications)details.append(element('p',record.modifications));
      if(record.kind==='recipe'){const add=element('button','Ajouter à Grocy','gr-import-primary');add.type='button';add.onclick=()=>publicRecipeImport(record.id,1);details.append(add);}
      details.append(download('Télécharger cette fiche JSON',record.id+'.json',{schema:'grocyste-public-record-v1',record}));
      details.focus();
    } catch(e) { if(ticket===request)details.replaceChildren(element('p',e.message)); }
  }
  function render(reset=false) {
    if(reset)page=0;current=search(data.entries,{query:input.value,kind:kind.value,language:language.value,origin:origin.value,full:check.checked});
    const pages=Math.max(1,Math.ceil(current.length/48));page=Math.min(page,pages-1);results.replaceChildren();
    for(const e of current.slice(page*48,(page+1)*48)) { const b=element('button',undefined,'gc-card');b.type='button';b.append(element('strong',e.name),element('small',`${e.kind==='recipe'?'Recette':'Produit'} · ${e.language.toUpperCase()} · ${e.origin==='wikibooks'?'Wikilivres':'Fiche partagée'}`));b.onclick=()=>open(e);results.append(b); }
    status.textContent=`${current.length.toLocaleString('fr')} résultats · page ${page+1}/${pages}`;navigation.replaceChildren();
    for(const [label,delta] of [['Précédente',-1],['Suivante',1]]) {const b=element('button',label);b.type='button';b.disabled=page+delta<0||page+delta>=pages;b.onclick=()=>{page+=delta;render();};navigation.append(b);}
  }
  let debounce;input.oninput=()=>{clearTimeout(debounce);debounce=setTimeout(()=>render(true),100);};for(const field of [kind,language,origin,check])field.onchange=()=>render(true);render();
  const requested=data.entries.find(e=>e.id===location.hash.slice(1));if(requested)await open(requested);
}
function start(){
  if(sdk){sdk.register({id:'public-catalog',name:'Grocyste — Catalogue public',version:'1.0.2'});const menu=document.querySelector('.dropdown-menu[aria-labelledby="topnav-settings-dropdown"], #topnav-settings-dropdown .dropdown-menu')||document.querySelector('a[href$="/stocksettings"]')?.closest('.dropdown-menu');const a=element('a','Grocyste — Catalogue public','dropdown-item');a.href=asset('index.html');menu?.append(a);installRecipeImport(sdk);return;}
  const host=document.getElementById('catalog');if(host)mount(host).catch(e=>{host.append(element('p',e.message));});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

})();

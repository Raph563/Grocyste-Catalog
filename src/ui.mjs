/* SPDX-License-Identifier: GPL-3.0-or-later */
import { publicUrl, search, validateIndex, boundedJson, validateRecord } from './catalog.mjs';
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
  if(sdk){sdk.register({id:'public-catalog',name:'Grocyste — Catalogue public',version:'1.0.0'});const menu=document.querySelector('.dropdown-menu[aria-labelledby="topnav-settings-dropdown"], #topnav-settings-dropdown .dropdown-menu')||document.querySelector('a[href$="/stocksettings"]')?.closest('.dropdown-menu');const a=element('a','Grocyste — Catalogue public','dropdown-item');a.href=asset('index.html');menu?.append(a);return;}
  const host=document.getElementById('catalog');if(host)mount(host).catch(e=>{host.append(element('p',e.message));});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

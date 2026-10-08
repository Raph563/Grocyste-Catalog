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

import sys, pathlib, json, re, hashlib, html, math, collections
from urllib.parse import urlsplit, urlunsplit, quote
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--cache-dir',type=pathlib.Path,required=True)
parser.add_argument('--private-snapshot',type=pathlib.Path,required=True)
parser.add_argument('--output',type=pathlib.Path,required=True)
args=parser.parse_args()
ROOT=args.cache_dir.resolve()
import mwparserfromhell as mw
DEST=args.output.resolve()
DATA=DEST/'data';DATA.mkdir(parents=True,exist_ok=True)
LICENSE='https://creativecommons.org/licenses/by-sa/4.0/'

def digest(value):return hashlib.sha256(value.encode()).hexdigest()[:20]
def dump(file,value):file.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
def text(value):return html.unescape(re.sub(r'<[^>]*>',' ',str(value or ''))).strip()
def url(value,hosts=None):
    try:
        p=urlsplit(str(value));assert p.scheme=='https' and p.hostname and not p.username and not p.password and p.port in (None,443)
        if hosts:assert p.hostname in hosts
        return urlunsplit((p.scheme,p.netloc,p.path,'',''))
    except (ValueError,AssertionError):return None
def numeric(value):
    try:
        n=float(value)
        return n if math.isfinite(n) and n>=0 else None
    except (ValueError,TypeError):return None
def object_json(raw):
    try:
        v=json.loads(raw or '{}');return v if isinstance(v,dict) else {}
    except (ValueError,TypeError):return {}

from wiki_text import plain,sections,lines

wiki=[];excluded=collections.Counter();unresolved=0
for language in ['fr','en']:
    for p in json.loads((ROOT/('wikibooks-'+language+'.json')).read_text(encoding='utf-8')):
        rev=p['revisions'][0];raw=rev['slots']['main']['content'];sec=sections(raw)
        if re.search(r'(?i)\{\{\s*(copyvio|copyright violation|copyhold|fair.?use|non.?free)',raw):excluded['licence_to_review']+=1;continue
        if language=='fr' and not ('ingredients' in sec and 'instructions' in sec):excluded['fr_index_or_technical_page']+=1;continue
        source='https://'+p['host']+'/wiki/'+quote(p['title'].replace(' ','_'),safe=':/')
        ingredients=lines('\n'.join(sec.get('ingredients',[])))
        instructions=lines('\n'.join(sec.get('instructions',[])))
        has_templates=any('{{' in v for v in ingredients+instructions)
        if has_templates:unresolved+=1
        title=re.sub(r'^(Cookbook:|Livre de cuisine/)', '',p['title'])
        categories=[str(n.title).split(':',1)[1].split('|',1)[0] for n in mw.parse(raw).filter_wikilinks() if re.match(r'(?i)^(category|catégorie):',str(n.title))]
        wiki.append({'id':'w-'+language+'-'+str(p['pageid']),'kind':'recipe','name':title,'language':language,'origin':'wikibooks','availability':'text' if ingredients and instructions else 'source-only','ingredients':ingredients,'instructions':instructions,'notes':lines('\n'.join([raw[h.end():next((n.start() for n in list(re.finditer(r'(?m)^(={2,6})\s*(.*?)\s*\1\s*$',raw)) if n.start()>h.start() and len(n[1])<=len(h[1])),len(raw))] for h in re.finditer(r'(?m)^(={2,6})\s*(.*?)\s*\1\s*$',raw) if re.search(r'(?i)notes|variations|conseils|sources|references|r[eé]f[eé]rences',h[2])])),'tags':categories,'source':source,'revision':rev['revid'],'source_revision':'https://'+p['host']+'/w/index.php?oldid='+str(rev['revid']),'contributors':source+'?action=history','license':'CC-BY-SA-4.0','license_url':LICENSE,'modifications':'Extraction en texte, liens simplifiés, médias exclus. Quantités originales conservées ; aucune conversion automatique.','unresolved_markup':has_templates})

snapshot=json.loads(args.private_snapshot.read_text(encoding='utf-8'))
tables=snapshot['tables'];qu={str(r['id']):text(r['name']) for r in tables['quantity_units']}
product_ids={str(p['id']):'p-'+digest('product:'+str(p['id'])+':'+p['name']) for p in tables['products']}
products=[];prices=0;nutrition=0
for p in tables['products']:
    fields=p.get('userfields') or {};ref=object_json(fields.get('courses_u_reference_v1'));nut=object_json(fields.get('courses_u_nutrition_v1'))
    source=url(ref.get('source_url'),['www.coursesu.com']) or url(nut.get('source_url'),['www.coursesu.com'])
    price=None
    amount=numeric(ref.get('package_price'));stock_amount=numeric(ref.get('package_stock_amount'))
    if (amount is not None and 0<amount<1000 and stock_amount is not None and stock_amount>0 and source and ref.get('match')=='exact' and ref.get('currency')=='EUR' and ref.get('price_kind')=='regular' and ref.get('observed_at') and not ref.get('kind')=='purchase' and not any(k in ref for k in ['purchased_at','evidence_id'])):
        price={'amount':amount,'currency':'EUR','package_quantity':stock_amount,'package_unit':qu.get(str(ref.get('stock_qu_id'))),'observed_at':ref['observed_at'],'source':source,'status':'historical-unreverified','scope':'Observation locale ancienne ; prix actuel et magasin non publiés. Hors fidélité et achats multiples.'};prices+=1
    energy=numeric(nut.get('energy_kcal'));basis=numeric(nut.get('basis_amount'));energy_data=None
    if energy is not None and basis and url(nut.get('source_url'),['www.coursesu.com']):
        energy_data={'energy_kcal':energy,'basis_amount':basis,'basis_unit':nut.get('basis_unit') or ('g' if nut.get('basis_kind')=='mass' else None),'source':url(nut['source_url'],['www.coursesu.com']),'status':'historical-unreverified'};nutrition+=1
    barcodes=sorted(set(str(b['barcode']) for b in tables['product_barcodes'] if str(b['product_id'])==str(p['id']) and re.fullmatch(r'\d{8}|\d{12,14}',str(b.get('barcode','')))))
    products.append({'id':product_ids[str(p['id'])],'kind':'product','name':text(p['name']),'brand':text(fields.get('Marque')) or None,'sub_brand':text(fields.get('Sous_marque')) or None,'barcodes':barcodes,'stock_unit':qu.get(str(p['qu_id_stock'])),'purchase_unit':qu.get(str(p['qu_id_purchase'])),'parent':product_ids.get(str(p.get('parent_product_id'))),'source':source,'reference_price':price,'nutrition':energy_data,'origin':'shared-facts','status':'Source à relire avant import ; pas de conversion publiée comme prouvée.','license':'CC-BY-SA-4.0','license_url':LICENSE})

normal=[r for r in tables['recipes'] if r['type']=='normal'];recipe_ids={str(r['id']):'r-'+digest('recipe:'+str(r['id'])+':'+r['name']) for r in normal};product_map={str(p['id']):p for p in tables['products']}
native=[]
for r in normal:
    desc=r.get('description') or '';sources=re.findall(r'https://[^\s"<>]+',desc)
    sources=[u for u in sources if not re.search(r'\.(png|jpe?g|webp)(\?|$)|localhost|127\.0\.0\.1|actually-caring|/files/',u,re.I)]
    source=next((url(html.unescape(u)) for u in sources if url(html.unescape(u))),None)
    ingredients=[]
    for pos in tables['recipes_pos']:
        if str(pos['recipe_id'])!=str(r['id']):continue
        product=product_map.get(str(pos['product_id']));name=text(product['name']) if product else 'Produit inconnu'
        ingredients.append({'name':name,'product':product_ids.get(str(pos['product_id'])),'quantity':numeric(pos['amount']),'unit':qu.get(str(pos['qu_id'])),'group':text(pos.get('ingredient_group')) or None,'variable':text(pos.get('variable_amount')) or None})
    subrecipes=[{'recipe':recipe_ids[str(n['includes_recipe_id'])],'servings':numeric(n['servings'])} for n in tables['recipes_nestings'] if str(n['recipe_id'])==str(r['id']) and str(n['includes_recipe_id']) in recipe_ids]
    native.append({'id':recipe_ids[str(r['id'])],'kind':'recipe','name':text(r['name']),'language':'fr','origin':'shared-facts','availability':'ingredients-and-source','ingredients':ingredients,'instructions':[],'notes':['Fiche factuelle partagée. Les instructions et photos tierces ne sont pas redistribuées. Consulter la source pour la méthode.'],'base_servings':numeric(r['base_servings']),'subrecipes':subrecipes,'tags':[],'source':source,'license':'CC-BY-SA-4.0','license_url':LICENSE,'unresolved_markup':False})

wiki_sources={('w-'+p['language']+'-'+str(p['pageid'])):p['revisions'][0]['slots']['main']['content'] for language in ['fr','en'] for p in json.loads((ROOT/('wikibooks-'+language+'.json')).read_text(encoding='utf-8'))}
for record in wiki:
    record['source_text']=plain(wiki_sources[record['id']])
all_recipes=sorted(native+wiki,key=lambda r:(r['language']!='fr',r['name'].casefold(),r['id']))
index=[]
for offset in range(0,len(all_recipes),100):
    chunk=all_recipes[offset:offset+100];filename=f'recipes-{offset//100:03}.json';dump(DATA/filename,chunk)
    for r in chunk:index.append({k:r[k] for k in ['id','kind','name','language','origin','availability']}|{'file':'data/'+filename,'tags':r['tags'],'search_terms':' '.join(i if isinstance(i,str) else i['name'] for i in r['ingredients'])[:30000]})
dump(DATA/'products.json',products)
for p in products:index.append({'id':p['id'],'kind':'product','name':p['name'],'language':'fr','origin':p['origin'],'availability':'facts','file':'data/products.json','tags':[p['brand']] if p['brand'] else [],'search_terms':' '.join(p['barcodes'])})
summary={'schema':1,'version':'1.0.0','collected_at':snapshot['collected_at'],'recipes':len(all_recipes),'products':len(products),'recipes_with_text':sum(r['availability']=='text' for r in all_recipes),'shared_recipes':len(native),'wikibooks_recipes':len(wiki),'languages':dict(collections.Counter(r['language'] for r in all_recipes)),'historical_reference_prices':prices,'historical_nutrition_facts':nutrition,'unresolved_markup':unresolved,'excluded':dict(excluded),'license_url':LICENSE,'limits':['Textes communautaires non testés en cuisine.','Les quantités restent dans les unités originales.','Les prix sont des observations datées, pas des offres actuelles.','Les fiches privées partagées excluent stocks, achats, prescriptions, photos et descriptions commerciales.']}
dump(DATA/'index.json',{'schema':1,'summary':summary,'entries':index})
dump(DATA/'summary.json',summary)
dump(ROOT/'private-mapping.json',{'products':product_ids,'recipes':recipe_ids})
print(json.dumps(summary,ensure_ascii=False))

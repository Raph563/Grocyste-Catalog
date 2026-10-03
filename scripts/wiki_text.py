import re,html
import mwparserfromhell as mw

def plain(raw):
    out=[]
    for node in mw.parse(raw).nodes:
        kind=type(node).__name__
        if kind=='Text':out.append(str(node))
        elif kind=='Wikilink':
            title=str(node.title)
            if re.match(r'(?i)^(category|catégorie|file|image|fichier):',title):continue
            out.append(plain(str(node.text)) if node.text is not None else re.sub(r'^(Cookbook:|Livre de cuisine/|w:|wikipedia:)', '', title))
        elif kind=='ExternalLink':out.append((plain(str(node.title))+' ' if node.title else '')+'('+str(node.url)+')')
        elif kind=='Heading':out.append('\n'+plain(str(node.title))+'\n')
        elif kind=='Template':
            name=str(node.name).strip().lower()
            args=[str(p.value).strip() for p in node.params if str(p.name).strip().isdigit()]
            if name in ['i',"i'",'ingrédient','ustensile','u','unité','unit','techniquecuisine']:
                if args:out.append(plain(' '.join(args) if name in ['u','unité','unit'] else args[-1]))
            elif name in ['convert','conversion'] and len(args)>=2:out.append(plain(args[0])+' '+args[1])
            elif name in ['frac','fraction'] and len(args)>=2:out.append((' '.join(args[:-2])+' ' if len(args)>2 else '')+args[-2]+'/'+args[-1])
            elif name in ['livre de cuisine','recipe','recipesummary','recipe summary','recipe summary2','cookbook','autres projets','reflist','commons','commonscat']:continue
            else:out.append(str(node))  # Do not silently erase an unresolved food quantity.
        elif kind=='Tag':
            if str(node.tag).lower() in ['gallery','imagemap','script','style']:continue
            if node.contents is not None:out.append(plain(str(node.contents)))
            elif str(node.tag).lower() in ['br','hr']:out.append('\n')
        elif kind=='HTMLEntity':out.append(html.unescape(str(node)))
    result=''.join(out)
    result=re.sub(r"'{2,5}", '', result)
    result=re.sub(r'__[A-Z_]+__','',result)
    return re.sub(r'\n{3,}','\n\n',result).strip()

def sections(raw):
    raw=re.sub(r'(?mi)^\s*(préparation|preparation|procedure|directions|method)\s*:?\s*$',r'== \1 ==',raw)
    headings=list(re.finditer(r'(?m)^(={2,6})\s*(.*?)\s*\1\s*$',raw))
    spans=[];fallback=[]
    for i,h in enumerate(headings):
        name=plain(h[2]).casefold()
        end=next((n.start() for n in headings[i+1:] if len(n[1])<=len(h[1])),len(raw))
        kind='ingredients' if re.search(r'ingr[eé]dients?',name) else 'instructions' if re.search(r'pr[eé]paration|proc[eé]dure|instructions?|directions?|method|r[eé]alisation',name) else None
        if kind:spans.append((kind,h.end(),end))
        elif re.fullmatch(r'(?:la\s+)?recette',name):fallback.append(('instructions',h.end(),end))
    if not any(s[0]=='instructions' for s in spans):
        spans.extend(s for s in fallback if not any(i[0]=='ingredients' and s[1]<=i[1]<s[2] for i in spans))
    result={}
    for kind,start,end in spans:
        # A parent already includes its subsections. Extract them once only.
        if any(k==kind and a<start and b>=end for k,a,b in spans):continue
        result.setdefault(kind,[]).append(raw[start:end])
    return result
def lines(raw):
    cleaned=plain(raw)
    return [re.sub(r'^[*#:;]+\s*','',v).strip() for v in cleaned.splitlines() if v.strip()]


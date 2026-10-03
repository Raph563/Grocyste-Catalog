# Grocyste — Catalogue public

Un dixième addon Grocyste pour consulter des recettes et des fiches produits, sans compte ni clé API. Il fonctionne également comme site statique.

La collection 1.0.0 comprend **5 098 fiches recettes** (1 302 en français, 3 796 en anglais), dont **5 011 avec ingrédients et préparation**, et **690 fiches produits**. Les 70 recettes normales de la collection partagée sont présentes sous forme factuelle. Les recettes de planning et menus personnels sont exclues.

**[Ouvrir le catalogue](https://raph563.github.io/Grocyste-Catalog/)** · [Télécharger la collection et le paquet signé](https://github.com/Raph563/Grocyste-Catalog/releases/latest)

La recherche accepte les accents, ingrédients et codes-barres, et filtre produits, recettes, langue et collection. Les adresses des fiches sélectionnées peuvent être partagées directement. Chaque fiche se consulte et se télécharge en JSON. Les liens vers les sources, révisions et contributeurs accompagnent les recettes libres. Les familles de produits et sous-recettes conservent leurs références publiques.

## Ce qui est partagé

Les recettes Wikilivres/Wikibooks sont distribuées sous **CC BY-SA 4.0** : texte simplifié, ingrédients, méthode, notes, attribution et révision source. La collecte couvre les pages de recettes du Cookbook anglais et les pages françaises comportant ingrédients et préparation. 257 index ou pages techniques françaises sont exclus.

Les produits partagent nom, marque, codes-barres enregistrés, noms d’unités, famille et références publiques disponibles. **85 prix** sont des observations anciennes, datées et localisées à l’origine : le magasin n’est pas publié et le prix actuel doit être revérifié. **130 références énergétiques** sont conservées avec leur source et leur base ; une unité manquante reste inconnue.

Les 70 recettes provenant de la collection privée partagent titre, portions de référence, ingrédients, quantités originales, sous-recettes et source lorsqu’elle est connue (58 sur 70). Les textes et photos de sites commerciaux ne sont pas redistribués. La méthode reste à consulter à la source. La publication ne transforme pas leurs références d’unités en conversions prouvées.

Aucun stock, achat, ticket, prix payé, historique, compte, emplacement domestique, prescription, sauvegarde ou photo privée n’est livré. Les descriptions commerciales et médias tiers sont exclus. Les identifiants de la base privée sont remplacés par des identifiants de catalogue.

## Installation Grocyste

CORE **1.0.0 ou ultérieur**, Grocy **4.7.1**. Aucune dépendance addon ni capacité métier : l’addon ne lit ni n’écrit la base Grocy. Il ajoute un lien « Grocyste — Catalogue public » au menu.

Télécharger `public-catalog-1.0.0.zip` et sa métadonnée depuis la release. Vérifier le SHA-256 puis installer le paquet avec le gestionnaire Grocyste et sa clé de confiance existante. Le paquet possède un manifeste et une signature Ed25519 ; aucune clé privée n’est distribuée. Une procédure serveur complète figure dans [INSTALLATION.md](INSTALLATION.md).

L’URL publique de l’instance est `/__grocyste/assets/public-catalog/index.html` (préfixer le sous-répertoire Grocy si nécessaire). Les fichiers sont servis et vérifiés par le CORE. Le site GitHub Pages reste accessible sans instance Grocy.

L’addon ne charge pas automatiquement les milliers de recettes ou produits dans une instance. Le téléchargement d’une fiche est un export de catalogue, **pas** une proposition d’import SafeImport validée : les produits, unités et conversions de l’instance cible doivent être rapprochés et relus avant toute importation.

## Validation et limites

Les tests vérifient la collection, les références, la recherche, les limites des réponses et l’exclusion des champs privés. Les parcours de consultation et téléchargement sont exercés dans un navigateur puis sur Grocy 4.7.1 isolé.

Les recettes communautaires n’ont pas été testées en cuisine. 17 pages anglaises restent accessibles par leur source lorsque l’extraction ingrédients/méthode est incomplète. Dans 179 recettes libres, certains modèles wiki restent visibles ; la révision source et le texte source simplifié sont conservés. Les unités impériales et métriques restent celles de la source. Aucun prix n’est annoncé comme offre actuelle et aucune disponibilité en magasin n’est promise.

Les huit échecs historiques du catalogue privé ne sont pas corrigés par ce lot. Les données de ce catalogue public sont indépendantes des parcours métier concernés.

## Développement et reconstruction

Node **24 LTS** : `npm test` puis `npm run build`. Le navigateur utilise les assets publics, sans cookie ni jeton. Les liens externes sont ouverts sans transmettre le contexte de l’instance. Le rendu utilise des nœuds texte.

Pour recollecter les sources libres : installer `scripts/requirements.txt` dans un environnement Python dédié, puis lancer `python scripts/collect_wikibooks.py --cache-dir /chemin/prive/cache`. Pour créer une nouvelle collection à partir d’un instantané privé obtenu en lecture seule : `python scripts/build_data.py --cache-dir /chemin/prive/cache --private-snapshot /chemin/prive/snapshot.json --output /chemin/catalogue`. Le cache et la correspondance privée restent hors du dépôt. Une nouvelle collecte doit recevoir une nouvelle version ; ne jamais remplacer un paquet signé publié.

Logiciel **GPL v3 ou ultérieure**. Textes et collection de données : **CC BY-SA 4.0**, avec attributions propres à chaque fiche ; les marques restent à leurs titulaires. Voir [PROVENANCE.md](PROVENANCE.md).

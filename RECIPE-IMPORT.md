## Ajout confirmé des recettes — 8 octobre 2026

Le bouton « Ajouter à Grocy » ouvre une nouvelle fenêtre sur l’instance choisie, puis un aperçu avec Ajouter / Annuler. Les fiches signées sont mises en forme avec ingrédients, préparation disponible, portions, source et licence. Une portion inconnue exige une saisie explicite. Les recettes dont la méthode n’est pas redistribuable conservent leur lien source.

CORE et Catalogue 1.0.2 : confirmation sous session Grocy, contrôle des capacités, origine et CSRF ; verrou interprocessus et reçu durable. Une réponse perdue déclenche une réconciliation sans rejouer l’écriture. La communauté n’obtient aucune clé Grocy.

Validation : 179 tests Python dans Python 3.12/Linux, 8 tests Node 24 ; 81 tests ciblés incluant les nouveaux contrôles de permissions. Ajout, annulation et second clic vérifiés sur Grocy 4.7.1 vierge et clone isolé. Onze ensembles métier préservés durant les imports ; artefacts de laboratoire retirés. Mise à jour de production après sauvegardes SQLite intègres : douze tables métier, schéma, personnalisations et neuf autres addons conservés.

Limite explicite : l’import crée une fiche recette. Les ingrédients sont dans sa préparation, sans création de produits ni association aux stocks ; aucun achat ni consommation. Les packs et l’import avec résolution complète des produits restent un lot séparé. Les comptes et contributions communautaires restent fermés pendant la qualification SMTP.

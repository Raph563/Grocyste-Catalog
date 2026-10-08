# Livraison catalogue 1.0.0

- [x] Collecter les pages des deux livres de cuisine et conserver révisions/attributions.
- [x] Exporter les 690 produits et 70 recettes normales par liste de champs fermée.
- [x] Distinguer les observations de prix publics des achats personnels.
- [x] Recherche, filtres, lecture, sous-recettes/familles et téléchargement JSON.
- [x] Tests Node 24, référence des fiches et limites de réponses.
- [x] Qualification navigateur et Grocy isolé.
- [x] Paquet signé, publication publique et accès anonyme vérifié.
- [x] Activation de l’addon et conservation des données de l’instance.


## Ajout confirmé des recettes — 8 octobre 2026

Le bouton « Ajouter à Grocy » ouvre une nouvelle fenêtre sur l’instance choisie, puis un aperçu avec Ajouter / Annuler. Les fiches signées sont mises en forme avec ingrédients, préparation disponible, portions, source et licence. Une portion inconnue exige une saisie explicite. Les recettes dont la méthode n’est pas redistribuable conservent leur lien source.

CORE et Catalogue 1.0.2 : confirmation sous session Grocy, contrôle des capacités, origine et CSRF ; verrou interprocessus et reçu durable. Une réponse perdue déclenche une réconciliation sans rejouer l’écriture. La communauté n’obtient aucune clé Grocy.

Validation : 184 tests Python dans Python 3.12/Linux, 8 tests Node 24 ; 81 tests ciblés incluant les nouveaux contrôles de permissions. Ajout, annulation et second clic vérifiés sur Grocy 4.7.1 vierge et clone isolé. Onze ensembles métier préservés durant les imports ; artefacts de laboratoire retirés. Mise à jour de production après sauvegardes SQLite intègres : douze tables métier, schéma, personnalisations et neuf autres addons conservés.

Limite explicite : l’import crée une fiche recette. Les ingrédients sont dans sa préparation, sans création de produits ni association aux stocks ; aucun achat ni consommation. Les packs et l’import avec résolution complète des produits restent un lot séparé. Les comptes et contributions communautaires restent fermés pendant la qualification SMTP.

Catalogue 1.0.4 : portions choisies visibles dans l’aperçu ; lien de résultat conforme à /recipe/{id} de Grocy 4.7.1. Aperçu et annulation vérifiés dans la session de production, sans import métier.

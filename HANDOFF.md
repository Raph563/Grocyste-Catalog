# Reprise du catalogue public

Le lot 1.0.0 publie une collection statique et un addon de consultation, compatible CORE 1.0.0 / Grocy 4.7.1. Aucun import massif dans la base privée, aucune conversion inventée, aucune modification des neuf addons existants.

Les sources externes sont attribuées par fiche ; les prix sont anciens et à revalider. Les données originales privées, cache brut, correspondance d’identifiants et clés de signature sont exclus. Ne jamais remplacer la release signée après publication.

Les fiches JSON téléchargées ne satisfont pas à elles seules le contrat SafeImport. Une future intégration d’import doit résoudre les produits/unités sur l’instance cible, produire une proposition relisible, recueillir son approbation et conserver une réconciliation après réponse perdue.

La qualification passe : Node 24 (8), extraction wiki (7), navigateur public (14), intégration PHP Grocy et absence de capacité métier (4), cycle de vie (5). Le dixième addon est activé ; les douze tables métier, le schéma, les personnalisations, les fichiers de configuration et les sept identités de services suivies sont conservés.

Le dépôt public, la release v1.0.0 et GitHub Pages sont disponibles. Les six assets sont récupérés anonymement et leurs empreintes concordent ; les deux index publics sont vérifiés. Le paquet publié est figé (SHA-256 dans VALIDATION.md). Les ajouts documentaires ultérieurs ne remplacent ni le tag ni le paquet.

La CI manuelle et GitHub Pages passent sur 26c9f719f6b3ae06c582f43d766691ffbfdb6299. Les données et fichiers du navigateur sont inchangés depuis le tag ; seul le workflow accepte désormais un déclenchement manuel. Le paquet public est installé par le gestionnaire depuis un cache vide, sans accès Grocy. Le rejeu réel est un noop et la route legacy reste fermée.


## Ajout confirmé des recettes — 8 octobre 2026

Le bouton « Ajouter à Grocy » ouvre une nouvelle fenêtre sur l’instance choisie, puis un aperçu avec Ajouter / Annuler. Les fiches signées sont mises en forme avec ingrédients, préparation disponible, portions, source et licence. Une portion inconnue exige une saisie explicite. Les recettes dont la méthode n’est pas redistribuable conservent leur lien source.

CORE et Catalogue 1.0.2 : confirmation sous session Grocy, contrôle des capacités, origine et CSRF ; verrou interprocessus et reçu durable. Une réponse perdue déclenche une réconciliation sans rejouer l’écriture. La communauté n’obtient aucune clé Grocy.

Validation : 184 tests Python dans Python 3.12/Linux, 8 tests Node 24 ; 81 tests ciblés incluant les nouveaux contrôles de permissions. Ajout, annulation et second clic vérifiés sur Grocy 4.7.1 vierge et clone isolé. Onze ensembles métier préservés durant les imports ; artefacts de laboratoire retirés. Mise à jour de production après sauvegardes SQLite intègres : douze tables métier, schéma, personnalisations et neuf autres addons conservés.

Limite explicite : l’import crée une fiche recette. Les ingrédients sont dans sa préparation, sans création de produits ni association aux stocks ; aucun achat ni consommation. Les packs et l’import avec résolution complète des produits restent un lot séparé. Les comptes et contributions communautaires restent fermés pendant la qualification SMTP.

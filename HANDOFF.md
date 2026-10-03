# Reprise du catalogue public

Le lot 1.0.0 publie une collection statique et un addon de consultation, compatible CORE 1.0.0 / Grocy 4.7.1. Aucun import massif dans la base privée, aucune conversion inventée, aucune modification des neuf addons existants.

Les sources externes sont attribuées par fiche ; les prix sont anciens et à revalider. Les données originales privées, cache brut, correspondance d’identifiants et clés de signature sont exclus. Ne jamais remplacer la release signée après publication.

Les fiches JSON téléchargées ne satisfont pas à elles seules le contrat SafeImport. Une future intégration d’import doit résoudre les produits/unités sur l’instance cible, produire une proposition relisible, recueillir son approbation et conserver une réconciliation après réponse perdue.

La qualification passe : Node 24 (8), extraction wiki (7), navigateur public (14), intégration PHP Grocy et absence de capacité métier (4), cycle de vie (5). Le dixième addon est activé ; les douze tables métier, le schéma, les personnalisations, les fichiers de configuration et les sept identités de services suivies sont conservés.

Le dépôt public, la release v1.0.0 et GitHub Pages sont disponibles. Les six assets sont récupérés anonymement et leurs empreintes concordent ; les deux index publics sont vérifiés. Le paquet publié est figé (SHA-256 dans VALIDATION.md). Les ajouts documentaires ultérieurs ne remplacent ni le tag ni le paquet.

La CI manuelle et GitHub Pages passent sur 26c9f719f6b3ae06c582f43d766691ffbfdb6299. Les données et fichiers du navigateur sont inchangés depuis le tag ; seul le workflow accepte désormais un déclenchement manuel. Le paquet public est installé par le gestionnaire depuis un cache vide, sans accès Grocy. Le rejeu réel est un noop et la route legacy reste fermée.

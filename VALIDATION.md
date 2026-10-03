# Validation de la collection 1.0.0

La livraison du 3 octobre 2026 publie 5 098 fiches recettes et 690 produits. 5 011 fiches possèdent ingrédients et préparation libre. Les 70 recettes normales de la collection partagée sont des fiches factuelles ; leurs méthodes tierces ne sont pas redistribuées.

| Contrôle exécuté | Résultat |
| --- | --- |
| Node 24 : collection, références, recherche, filtres, URL, fichiers et réponses bornés | 8 passent |
| Python 3.12 : extraction des sous-sections, titres de préparation et quantités originales | 7 passent |
| Navigateur : recherche, lecture, téléchargement, liens directs, pagination, mobile et texte XSS | 14 passent |
| Grocy 4.7.1 en PHP standard : dix addons chargés, lien du menu, refus API et lecture publique | 4 passent |
| Gestionnaire : désactivation, réactivation, désinstallation, réinstallation et rejeu | 5 passent ; neuf autres addons conservés |
| Activation réelle après sauvegarde SQLite cohérente et contrôle d’intégrité | 10 contrôles passent |
| Téléchargement anonyme des six assets publics de release | Tailles et SHA-256 conformes |
| Index publics GitHub Pages et instance Grocyste | Accessibles sans connexion ; 5 098 recettes / 690 produits |

L’activation réelle conserve les empreintes des douze tables métier et du schéma Grocy, les personnalisations, la configuration, le secret serveur et les sept identités de services suivies. Le chargeur et les routes Android n’ont pas été modifiés. Les reçus privés, sauvegardes et empreintes détaillées restent hors du dépôt.

Paquet `public-catalog-1.0.0.zip` : **836a44301838611664bc9b3f208c1d0cffde01ef1c13d82ec25e64d3bcca7509** (4 143 044 octets). Il contient 75 fichiers déclarés plus le manifeste et sa signature. La signature utilise la clé de confiance Grocyste existante ; aucune clé privée n’est distribuée.

Le manifeste déclare zéro capacité métier ; le CORE refuse effectivement un appel API Grocy émis par ce namespace. Les addons intégrés partagent le contexte JavaScript de Grocy et doivent rester du code examiné : cette déclaration ne constitue pas une sandbox contre un addon hostile. La lecture du catalogue est statique et n’envoie ni cookie ni clé dans ses téléchargements.

Les recettes ne sont pas validées en cuisine. 179 fiches conservent des modèles wiki non interprétés, visibles et documentés ; 17 pages anglaises renvoient à la source pour compléter l’extraction. Les 85 prix et 130 références énergétiques sont anciens et à relire. Aucun rapprochement d’unités avec une nouvelle instance, conversion, import massif, correction des huit échecs historiques ou nouvel APK n’est qualifié par ce lot.

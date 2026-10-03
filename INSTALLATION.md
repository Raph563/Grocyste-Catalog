# Installer sur une instance Grocyste existante

Grocy 4.7.1, CORE 1.0.0 minimum. L’addon ne demande aucune capacité métier. Aucun compte de service supplémentaire ni clé Grocy n’est nécessaire.

1. Télécharger `public-catalog-1.0.0.zip` et `public-catalog-1.0.0.metadata.json` depuis la release publique.
2. Lire le SHA-256 de la métadonnée ; comparer au fichier téléchargé. Identifier le conteneur qui exécute `python -m grocyste.manager`, utilisateur `1000:1000`.
3. Depuis les sources du tag v1.0.0, exécuter avec le droit d’administration Docker :

```sh
python3 scripts/install.py --manager-container NOM_DU_GESTIONNAIRE --package public-catalog-1.0.0.zip --sha256 EMPREINTE_DE_LA_METADONNEE
```

Le script vérifie l’empreinte locale, puis le gestionnaire vérifie la signature, les fichiers et le manifeste avec **sa clé de confiance existante**. L’activation passe par son socket Unix privé, sous son verrou interprocessus. Un paquet différent portant la même version est refusé. Un nouvel appel sur la même installation valide renvoie `noop`.

L’administrateur du serveur autorise cette installation en exécutant la commande. La commande n’ajoute aucun droit Docker au runtime et n’utilise pas une route d’administration publique. Elle écrit uniquement un paquet vérifié dans le répertoire de paquets du gestionnaire ; l’état précédent est conservé par son journal et ses générations.

Recharger Grocy : le menu donne accès au catalogue. Sans connexion Grocy, ouvrir directement `/__grocyste/assets/public-catalog/index.html`. Pour les installations sous un sous-répertoire, préfixer ce chemin avec ce sous-répertoire. Aucun redémarrage du CORE, modification de chargeur, intervention SQL ou changement Android n’est requis.

La désactivation et la désinstallation passent par les boutons d’administration Grocyste existants. Elles ne suppriment aucune donnée métier. En cas de réponse d’activation perdue, vérifier `current.json` et les reçus du gestionnaire avant de répéter : une erreur réseau ne prouve pas l’absence d’écriture.

Le catalogue signé de téléchargements joint à la release ajoute uniquement `public-catalog` aux neuf versions déjà vérifiées. Il est fourni pour les opérateurs qui maintiennent leur source de paquets ; l’installation ciblée ci-dessus n’oblige pas à remplacer le catalogue global.

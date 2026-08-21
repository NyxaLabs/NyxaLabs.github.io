NYXA PORTAL

But
---
Créer l'adresse principale de tous les projets NYXA :

https://nyxalabs.github.io/

Le portail référence automatiquement :
- /exposition-numerique/
- /nyxa-before/
- /nyxa-proof/
- /nyxa-homebook/
- /nyxa-linkcheck/
- /nyxa-identity/
- /nyxa-reflex/

Quand un de ces sites GitHub Pages existe réellement, sa carte passe automatiquement à "Disponible".
Sinon elle reste "À publier".

Publication gratuite sur GitHub Pages
--------------------------------------
1. Créer un dépôt PUBLIC portant EXACTEMENT le nom :
   NyxaLabs.github.io

2. Envoyer TOUT le contenu de ce dossier à la racine du dépôt :
   index.html
   styles.css
   app.js
   manifest.webmanifest
   service-worker.js
   assets/

3. Settings > Pages
   Source : Deploy from a branch
   Branch : main
   Folder : /(root)

Le portail sera alors disponible à :
https://nyxalabs.github.io/

Téléphone
---------
Le portail est responsive et possède un manifest + service worker.
Il peut donc être ajouté à l'écran d'accueil comme une mini-application.


Validation
----------
HTML/JS/CSS vérifiés localement : structure, syntaxe, ressources et compatibilité GitHub Pages.

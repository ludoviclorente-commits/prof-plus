# Prof+ — textes à copier-coller dans le Chrome Web Store

Tous les champs ci-dessous correspondent aux onglets du tableau de bord développeur (Chrome Web Store Developer Dashboard).

---

## Onglet « Fiche Play Store » / « Store listing »

**Nom** (repris du manifest, non modifiable ici)
> Prof+ — une interface claire pour I-Prof

**Résumé** (repris du manifest, 132 caractères max)
> Rend I-Prof lisible : tableau de bord, courrier, parcours. 100 % local, aucune donnée envoyée. Outil indépendant, non officiel.

**Description**
```
Prof+ transforme I-Prof, le portail carrière des enseignants, en une interface claire et moderne.

Connectez-vous à I-Prof comme d'habitude (via le portail de votre académie) : Prof+ s'affiche automatiquement par-dessus.

CE QUE VOUS TROUVEZ
• Accueil : votre échelon, la date de votre prochaine promotion avec un compte à rebours, votre ancienneté, les infos de l'académie et vos derniers messages.
• Courrier : tous vos messages au même endroit, avec recherche, filtres par thème et par non-lus, et pièces jointes téléchargeables.
• Mon parcours : frise des échelons, anciennetés, historique des affectations résumé (ou détaillé).
• Mon dossier : votre situation administrative en un tableau.
• CV & formations : diplômes, habilitations, formations suivies.
• Services : accès direct à SIAM, SIAE, SIAD…

VOS DONNÉES RESTENT CHEZ VOUS
• Tout se passe dans votre navigateur : Prof+ ne transmet aucune donnée, à personne.
• Pas de compte, pas de statistiques, pas de publicité, pas de pistage.
• Prof+ ne modifie rien dans I-Prof : il se contente d'afficher. Pour modifier votre dossier, un bouton vous renvoie vers l'écran I-Prof d'origine.
• Le code est ouvert (licence MIT).

À TOUT MOMENT
Le bouton « Interface d'origine » vous ramène à I-Prof tel quel, et « Ouvrir Prof+ » réaffiche la nouvelle interface.

COMPATIBILITÉ
Testé sur l'académie de Versailles (1er degré). Prévu pour toutes les académies : si un écran ne s'affiche pas correctement chez vous, Prof+ propose d'ouvrir la version I-Prof. Vos retours sont les bienvenus.

Prof+ est un outil indépendant, développé par un particulier. Il n'est ni édité, ni approuvé, ni affilié au ministère de l'Éducation nationale ou aux académies. « I-Prof » désigne l'application du ministère à laquelle Prof+ s'applique.
```

**Catégorie** : Outils → *Productivité* (ou « Éducation » si proposée dans la liste)
**Langue** : Français

**Images**
| Champ | Fichier |
|---|---|
| Icône du store (128×128) | `extension/icons/icon128.png` |
| Captures d'écran (1280×800) | `store/screenshots/1-accueil.png` … `5-services.png` |
| Petite tuile promotionnelle (440×280) | `store/promo-small-440x280.png` |
| Tuile marquee (1400×560, facultative) | `store/promo-marquee-1400x560.png` |

Toutes les captures utilisent des **données fictives** (« Claire Martin », écoles « Ville-Exemple »).

**Site web officiel** : laisser vide, ou l'adresse GitHub du projet une fois publié.
**URL d'assistance** : l'adresse GitHub (onglet « Issues ») ou une adresse e-mail.

---

## Onglet « Pratiques de confidentialité » / « Privacy practices »

**Objectif unique (Single purpose)**
```
Afficher une interface plus claire et plus lisible par-dessus le portail I-Prof des académies françaises, à partir des informations que l'utilisateur consulte déjà dans I-Prof avec sa propre session.
```

**Justification des autorisations**

*Autorisations d'hôte (scripts de contenu sur `https://*.ac-<académie>.fr/iprof/servletiprof*`)*
```
L'extension s'exécute uniquement sur les pages I-Prof des académies (domaines *.ac-*.fr, chemin /iprof/servletiprof*). Elle lit ces pages, avec la session déjà ouverte par l'utilisateur, pour les réafficher dans une interface plus lisible. Elle ne s'exécute sur aucun autre site.
```

*Autres autorisations* : aucune (l'extension ne demande ni « storage », ni « tabs », ni accès à d'autres sites).

**Code distant (Remote code)** : **Non, je n'utilise pas de code distant.**
```
Tout le code JavaScript est inclus dans le paquet de l'extension. Aucun script n'est chargé depuis un serveur externe.
```

**Utilisation des données**

L'extension *traite* localement des données (Google demande de les déclarer même quand elles ne quittent pas l'ordinateur). Cocher :
- [x] **Informations permettant d'identifier personnellement l'utilisateur** (nom, affectation affichés depuis I-Prof)
- [x] **Communications personnelles** (messages I-Prof, affichés à la demande)
- [ ] Tout le reste : non coché (santé, finances, authentification, localisation, historique web, activité, contenu de site web… → non)

Puis cocher les trois certifications :
- [x] Je ne vends ni ne transfère les données des utilisateurs à des tiers, en dehors des cas d'utilisation approuvés
- [x] Je n'utilise ni ne transfère les données des utilisateurs à des fins sans rapport avec l'objectif unique de mon article
- [x] Je n'utilise ni ne transfère les données des utilisateurs pour déterminer leur solvabilité ou accorder des prêts

**URL des règles de confidentialité** : l'adresse publique de la page `privacy.html` (voir PUBLIER.md, étape 3).

---

## Onglet « Distribution »

- **Paiement** : gratuit
- **Visibilité** : **Non répertorié** pour la phase de test (seules les personnes ayant le lien peuvent l'installer). Passer en « Public » plus tard.
- **Régions** : France (ajouter les DROM-COM si proposés séparément) ; ou « Toutes les régions ».

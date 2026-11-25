# Prof+ — une interface claire pour I-Prof

Une interface moderne et lisible par-dessus **I-Prof**, le portail carrière des enseignants.

> Outil **indépendant**, non affilié au ministère de l'Éducation nationale ni aux académies.

## Ce que ça fait

Quand vous ouvrez I-Prof, Prof+ affiche à la place une interface claire, organisée en six écrans :

- **Accueil** : votre situation (grade, échelon), la date de votre prochaine promotion avec un compte à rebours, votre ancienneté, les infos de l'académie et les derniers courriers.
- **Courrier** : tous vos messages au même endroit, avec une recherche, des filtres par thème et par non-lus, et les pièces jointes téléchargeables.
- **Mon parcours** : une frise des échelons, vos anciennetés et l'historique des affectations résumé (ou détaillé à la demande).
- **Mon dossier** : votre situation administrative.
- **CV & formations** : diplômes, habilitations et formations suivies.
- **Services** : SIAM, SIAE, SIAD…

Le bouton **« Interface d'origine »** vous ramène à tout moment à I-Prof tel quel. Le bouton **« Ouvrir Prof+ »** (en bas à droite) le réaffiche.

## Confidentialité

- **Tout reste dans votre navigateur.** Prof+ lit les pages I-Prof avec votre session déjà ouverte et les réaffiche autrement. Rien n'est envoyé à un serveur, il n'y a ni statistiques ni pistage.
- **Prof+ ne modifie rien dans I-Prof.** Il ne fait que consulter. Pour modifier votre CV, vos infos personnelles, etc., il vous renvoie vers l'écran I-Prof d'origine.
- **Une seule exception :** ouvrir un message dans Prof+ le marque comme lu, exactement comme dans I-Prof.
- Prof+ ne connaît pas vos identifiants : vous vous connectez normalement via ARENA.

## Installer (version de test)

### Chrome, Edge, Brave
1. Téléchargez ce dossier (ou le dossier `extension`).
2. Ouvrez `chrome://extensions` (ou `edge://extensions`).
3. Activez le **Mode développeur** (en haut à droite).
4. Cliquez sur **Charger l'extension non empaquetée** et choisissez le dossier `extension`.
5. Connectez-vous à I-Prof comme d'habitude (ARENA → I-Prof) : Prof+ s'affiche.

### Firefox
1. Ouvrez `about:debugging#/runtime/this-firefox`.
2. **Charger un module complémentaire temporaire…** → choisissez `extension/manifest.json`.
   (Avec cette méthode, le module disparaît au redémarrage de Firefox. La version publiée sur addons.mozilla.org n'aura pas ce problème.)

## Compatibilité

- Testé sur l'académie de **Versailles**, 1er degré (I-Prof V4).
- Configuré pour les domaines `*.ac-<académie>.fr/iprof/…` de toutes les académies. Les autres académies et le 2nd degré restent **à tester** : si un écran ne s'affiche pas correctement, Prof+ propose d'ouvrir la version I-Prof.

## Structure

```
extension/
  manifest.json      Manifest V3 (Chrome + Firefox)
  src/iprof.js       Lecture des pages I-Prof et parseurs (aucune requête hors I-Prof)
  src/ui.js          Interface (écrans, courrier, parcours…)
  src/content.js     Point d'entrée : affiche Prof+ par-dessus I-Prof (Shadow DOM)
  src/styles.css     Styles
  icons/
SPEC.md              Fiche technique : carte des écrans I-Prof, choix d'architecture
```

## Feuille de route

- [ ] Tester dans d'autres académies et dans le 2nd degré
- [ ] Fichiers d'exemple anonymisés + tests automatiques des parseurs
- [ ] Écran « Infos personnelles » (lecture seule)
- [ ] Publication sur le Chrome Web Store et sur addons.mozilla.org
- [x] Nom : « Prof+ » (sans « iProf », pour éviter toute confusion avec l’outil officiel)

## Licence

MIT — voir `LICENSE`.

## Publication

Tout le matériel pour le Chrome Web Store est dans `store/` : paquet zip, captures, tuiles, textes de la fiche (`FICHE-STORE.md`), politique de confidentialité (`privacy.html`) et guide pas à pas (`PUBLIER.md`).

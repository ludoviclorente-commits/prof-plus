# iProf+ — fiche technique (pour Claude Code)

Extension de navigateur (Chrome + Firefox) qui affiche une interface moderne par-dessus **I-Prof V4**, le portail carrière des enseignants. Outil **indépendant, non officiel**, open source. Destiné à être diffusé à d'autres enseignants.

Maquette de référence : canvas « iProf+ — maquette » (écrans Accueil et Mon parcours).

---

## 1. Principes non négociables

1. **100 % local.** Aucun serveur, aucune télémétrie, aucune requête vers un domaine autre qu'iProf. Rien n'est stocké hors du navigateur (au plus `chrome.storage.local` pour les préférences d'affichage, jamais les données de carrière).
2. **Lecture seule par défaut.** L'extension ne fait que des **GET** de consultation. Elle ne soumet jamais de formulaire qui modifie quelque chose (CV, obligation d'emploi, messagerie, « Quitter »…). Pour toute action d'écriture, on renvoie l'utilisateur vers l'écran iProf d'origine.
3. **Ne pas marquer les messages comme lus en arrière-plan.** Le détail d'un message (`CourrierE_DetailMessage`) n'est chargé que quand l'utilisateur clique dessus.
4. **Session de l'utilisateur.** L'extension utilise les cookies de la session déjà ouverte (connexion via ARENA). Elle ne gère jamais d'identifiants.
5. **Réversible.** Un bouton « Interface d'origine » masque la surcouche à tout moment.
6. **Aucune identité visuelle officielle** (pas de Marianne ni de logo du ministère). Mention « Outil indépendant, non affilié à l'Éducation nationale ».

---

## 2. Ce qu'on sait d'I-Prof (observé sur l'académie de Versailles, 1er degré)

### Accès
- Portail ARENA : `https://id.ac-versailles.fr/arena/mes-favoris` → lien « Accéder » (target `_blank`) vers
  - `https://si1d.ac-versailles.fr/iprof/servletiprofe` (enseignant)
  - `https://si1d.ac-versailles.fr/iprof/servletiprofa` (variante, à identifier)
- Après authentification, l'appli tourne sur `https://extranet.ac-versailles.fr/iprof/servletiprofe?...`
- **Autres académies** : même appli, domaines différents (`*.ac-<academie>.fr`). Les host permissions doivent couvrir `https://*.ac-*.fr/iprof/*` (à valider), et le code ne doit pas coder en dur « versailles ».

### Technique
- Servlet Java, HTML en tableaux imbriqués, pas de framework, pas de JSON.
- **Encodage ISO-8859-1** → décoder avec `new TextDecoder('iso-8859-1')` après `fetch(...).arrayBuffer()`.
- CSS : `/iprof/css/iprof.css` ; JS : `/iprof/js/commun.js`, `mmenu.js`, `menu_array.js`, `/iprof/aide/js/wopen.js`.
- Chaque page se termine par un texte « Code page : <code>. » → pratique pour identifier l'écran.
- La navigation se fait par `codeTraitement`. Les onglets passent par un formulaire POST (`form_onglets`), mais **un simple GET `?codeTraitement=<code>` renvoie aussi la page** (vérifié sur tous les écrans ci-dessous).
- Un paramètre `numu=<timestamp>` est ajouté à certains liens (anti-cache) ; non nécessaire en GET.
- Lien « Quitter » : `?codeTraitement=Quitter&numu=...` avec `confirm()` → **ne jamais appeler**.

### Carte des écrans (`?codeTraitement=...`)

| Code | Contenu | Structure observée |
|---|---|---|
| `Presentation` | Accueil I-Prof, messages d'info académiques (ex. mouvement), formulaire `formmail` (adresse de redirection) | texte libre + formulaire (**ne pas soumettre**) |
| `CourrierE` | Boîte aux lettres | `select name=codeThemeEnCours` (1=Carrière, 2=Affectation, 3=Autres thèmes, 4=Gestion collective, tous) ; compteurs « Thème : N messages non lus » ; liste « Courrier carrière reçu » = lignes `objet | JJ/MM/AAAA HH:MM` |
| `CourrierE_DetailMessage` | Détail d'un message | GET via form `f_message` : `codeTheme`, `dossier` (ex. `ca`), `messageID` (`<...JavaMail...>`), `codeTraitement` — **charger uniquement au clic** |
| `CourrierE_Archive` | Archives | via `f_message` |
| (f_message `typeDossier=recu/emis`) | Reçus / envoyés | |
| `Dossier` (= `Dossier_Synthese`) | Synthèse | blocs « Vous êtes... », « Votre adresse... », « Vos affectations... », « Votre situation administrative... » ; tableau `Libellé | Valeur | Depuis` pour Statut, Corps, Grade, Echelon, Position, Modalité service |
| `Dossier_Perso` | Infos personnelles | identité, adresse, téléphone, mails, conjoint, enfants (nom + date de naissance), référence bancaire |
| `Dossier_AffectationDetachementJSP` | Historique des affectations | lignes « Du JJ/MM/AAAA au JJ/MM/AAAA | établissement (REP...) Circonscription ... | type (Rattachement administratif / Affectation en suppléance...) » + sous-lignes fonction · quotité % · [P]/[S] (principale/secondaire). Triangles pour déplier. **Écran le plus illisible → priorité de refonte** |
| `Dossier_Anciennete` | Anciennetés au JJ/MM/AAAA | 3 lignes : générale de services, dans le corps, dans le grade (« N ans N mois N jours ») |
| `Nouveaux_Droits` | Obligation d'emploi (BOE) | texte + lien de mise à jour (**ne pas automatiser**) |
| `Perspectives` | Intro | texte |
| `Perspectives_Promotions` | Promotions | « Promotion d'échelon : Nème échelon le JJ/MM/AAAA (bonification d'ancienneté) Nème échelon le JJ/MM/AAAA (ancienneté) » ; « Promotion de corps : … liste d'aptitude … » |
| `Perspectives_AutresAffectations` | Autres affectations possibles | texte informatif |
| `Perspectives_AutresParcours` | Autres parcours | texte informatif |
| `Perspectives_Cessation` | Disponibilité, démission, retraite | texte informatif |
| `Cv` | Intro CV | texte |
| `Cv_Diplomes` | Diplômes + Titres et habilitations | tableaux `Type | Spécialité | Diplôme | Libellé | Année | Organisme | Enregistré` et `Libellé | Date de début | Date de fin` |
| `Cv_Formations` | Formations suivies | liste titre + organisateur entre parenthèses ; « formations de couleur = issues de Gaia » |
| `Cv_ActivitesProf`, `Cv_ActivitesPerso`, `Cv_Distinctions` | Rubriques CV éditables | « Aucun enregistrement. » si vide ; édition = **renvoyer vers iProf** |
| `Cv_Editer` | Édition/impression du CV | **non exploré**, ne pas appeler automatiquement |
| `Services` | Liens externes | formulaires POST `lienSiam`, `lienMvtSpe`, `lienMvtSpePJ`, `lienVoeuxSiamSpe`, `lienSiap`, `lienServices_SiapEpp` + liens SIAE, guide rendez-vous de carrière, Devenir enseignant, SIAD. Pour SIAM/SIAP : déclencher le vrai formulaire de la page d'origine (au clic utilisateur uniquement) |
| `Dossier` → form `imprimer` | Impression du dossier | POST `codeTraitement`, `action`, `numu` — à déclencher seulement au clic |

---

## 3. Architecture proposée

- **Manifest V3**, compatible Chrome et Firefox (polyfill `webextension-polyfill` si besoin).
- **Content script** injecté sur `https://*/iprof/servletiprof*` des domaines académiques :
  1. détecte qu'on est dans I-Prof (titre « IProf V4 » ou présence de `Code page :`) ;
  2. masque le `<body>` d'origine et monte l'app iProf+ dans un Shadow DOM (isolation du vieux CSS) ;
  3. charge en parallèle les écrans utiles via `fetch('/iprof/servletiprofe?codeTraitement=X', {credentials:'include'})` ;
  4. parse chaque page avec `DOMParser` → objets JS typés ;
  5. affiche le tableau de bord.
- **Couche `parsers/`** : un parseur par code page, chacun testé sur des **fixtures HTML anonymisées** (à créer à partir des vraies pages en remplaçant toutes les données). Les parseurs s'appuient sur les libellés texte (« Echelon », « Ancienneté générale de services »…) plutôt que sur la position des cellules : plus robuste d'une académie à l'autre.
- **Mode dégradé** : si un parseur échoue, l'écran correspondant affiche « Voir dans iProf » au lieu de planter.
- **UI** : vanilla TS + un petit framework léger (Preact ou Svelte), bundle avec Vite. Polices Inter / Space Grotesk embarquées dans l'extension (pas d'appel à Google Fonts, toujours pour le zéro réseau externe).
- **Calculs côté client** : jours restants avant les échéances, progression vers le prochain échelon, regroupement des affectations par période / poste principal.

## 4. Écrans de la v1 (cf. maquette)

1. **Accueil** : situation (grade, échelon, depuis), prochaine promotion (dates), anciennetés, alertes issues de `Presentation` (mouvement…), 5 derniers courriers avec non-lus, raccourcis SIAM / SIAE / impression.
2. **Mon parcours** : frise des échelons, 3 anciennetés, affectations regroupées par période (postes principaux par défaut, historique complet dépliable).
3. **Courrier** : liste filtrable par thème, recherche plein texte sur les objets, ouverture d'un message au clic.
4. Plus tard : **Mon dossier**, **CV & formations**, **Services**.

## 5. Étapes de travail

1. Initialiser le dépôt (`D:\Claude\iProf-plus`, git, licence open source type MIT ou EUPL).
2. Créer les fixtures anonymisées des pages (enregistrer le HTML depuis une vraie session, puis remplacer noms, dates, adresses, NUMEN, écoles).
3. Écrire et tester les parseurs (`Dossier`, `Dossier_Anciennete`, `Perspectives_Promotions`, `CourrierE`, `Dossier_AffectationDetachementJSP`).
4. Squelette d'extension MV3 + content script + bascule « interface d'origine ».
5. Écran Accueil, test réel sur la session d'une enseignante (Versailles, 1er degré).
6. Écrans Parcours et Courrier.
7. Trouver des testeurs : 2nd degré et autres académies ; ajuster les parseurs.
8. Publication Chrome Web Store + Firefox Add-ons, page GitHub expliquant la confidentialité.

## 6. Points ouverts

- Différences 1er / 2nd degré (le 2nd degré a peut-être d'autres rubriques ou une autre URL `servletiprof…`).
- Liste exacte des domaines I-Prof par académie.
- Rôle de `servletiprofa` sur ARENA.
- Nom définitif (éviter « iProf » dans le nom public pour limiter tout risque de confusion avec l'outil officiel).

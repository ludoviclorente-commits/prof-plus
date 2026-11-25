# Publier Prof+ sur le Chrome Web Store — pas à pas

Durée : environ 30 minutes de saisie, puis quelques jours d'examen par Google.

## 0. Avant de commencer
- [ ] Essayer l'extension quelques jours (Hemeline) et noter les bugs.
- [ ] Choisir l'adresse e-mail publique du projet. Google conseille un compte Gmail dédié, par exemple `profplus.extension@gmail.com`, car cette adresse sera visible sur la fiche du store.
- [x] Adresse de contact renseignée dans `store/privacy.html` : ludoviclorente@gmail.com

## 1. Créer le compte développeur (à faire toi-même)
1. Va sur https://chrome.google.com/webstore/devconsole avec le compte Google choisi.
2. Accepte le contrat développeur et paie les frais d'inscription uniques (5 $, par carte).
3. Remplis le profil : nom d'éditeur (par exemple « Prof+ » ou ton nom), e-mail de contact.
4. Vérifie l'adresse e-mail (Google envoie un lien).
5. **Statut de commerçant (UE)** : Google demande si tu agis en tant que « commerçant » (trader). Pour une extension gratuite, non commerciale et sans lien avec Mon Voisin, la réponse normale est **non-commerçant**. Si un jour tu la rattaches à ton activité pro, il faudra déclarer « commerçant » et afficher ton adresse.

## 2. Envoyer le paquet
1. Dans le tableau de bord : **Nouvel élément** → choisis `store/prof-plus-0.1.0.zip`.
2. Google lit le manifest : le nom, le résumé et les icônes se remplissent tout seuls.

## 3. Mettre la politique de confidentialité en ligne
Google exige une adresse publique. Deux options :
- **Rapide** : la page « Prof+ — Politique de confidentialité » est déjà publiée dans tes artefacts Claude. Ouvre-la, puis **Partager → accès public par lien**, et copie l'adresse.
- **Durable (recommandé)** : la publier sur GitHub Pages en même temps que le code (je peux le faire avec toi).

## 4. Remplir les onglets
Copie-colle depuis `store/FICHE-STORE.md` :
- **Fiche** : description, catégorie, langue, icône, 5 captures, petite tuile (et la tuile marquee si tu veux).
- **Pratiques de confidentialité** : objectif unique, justification des hôtes, « pas de code distant », types de données traités localement, 3 certifications, URL de la politique.
- **Distribution** : gratuit, **Non répertorié**, France.

## 5. Soumettre
- Clique sur **Envoyer pour examen**. Coche « publier automatiquement après validation » si tu veux.
- L'examen prend en général quelques jours. Comme l'extension tourne sur des sites précis et n'a aucune autre autorisation, elle ne devrait pas poser de difficulté particulière.
- Une fois validée, le lien de la fiche est à donner aux profs testeurs (installation en un clic, mises à jour automatiques).

## 6. Mettre à jour plus tard
1. Augmente `version` dans `extension/manifest.json` (0.1.0 → 0.1.1…).
2. Refais le zip du dossier `extension` (le `manifest.json` doit être à la racine du zip).
3. Tableau de bord → l'élément → **Package → Importer un nouveau package** → Envoyer pour examen.

## Points d'attention
- **Nom et image** : ne pas utiliser le logo du ministère, la Marianne ni le nom « I-Prof » comme nom principal. « … pour I-Prof » dans le sous-titre décrit simplement à quoi sert l'outil.
- **Retours des testeurs** : prévoir un moyen simple (e-mail, ou les « Issues » GitHub).
- **Si Google refuse** : le motif est indiqué par e-mail. Envoie-le-moi et on corrige.

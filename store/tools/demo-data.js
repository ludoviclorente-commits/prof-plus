// Données 100 % fictives pour les captures d'écran du store.
(function () {
  const D = (s) => { const [d, m, y] = s.split("/"); return new Date(+y, +m - 1, +d); };
  const msg = (objet, date, theme, extra = {}) => ({ id: "x", dossier: "ca", theme, objet, date: date + " 09:12", d: D(date), nonLu: false, pj: false, signale: /^\[signal/i.test(objet), ...extra });
  window.DEMO = {
    synth: {
      civilite: "Mme", nom: "Claire Martin", prenom: "Claire",
      affectation: "Rattachement administratif École maternelle Les Tilleuls, Ville-Exemple",
      situation: {
        Statut: { value: "Fonctionnaire de l'Éducation nationale", depuis: "01/09/2014" },
        Corps: { value: "professeur des écoles", depuis: "01/09/2014" },
        Grade: { value: "professeur des écoles de classe normale", depuis: "01/09/2014" },
        Echelon: { value: "07", depuis: "01/03/2024" },
        Position: { value: "en activité", depuis: "01/09/2014" },
        "Modalité service": { value: "travail à temps plein", depuis: "01/09/2022" },
      },
    },
    anc: { au: "01/09/2026", items: [
      { label: "Générale de services", full: "Ancienneté générale de services", value: "12 ans 0 mois 0 jours" },
      { label: "Dans le corps", full: "Ancienneté dans le corps", value: "12 ans 0 mois 0 jours" },
      { label: "Dans le grade", full: "Ancienneté dans le grade", value: "12 ans 0 mois 0 jours" },
    ] },
    promo: {
      raw: "", corps: "Vous remplissez les conditions pour candidater à la liste d'aptitude aux fonctions de directeur d'école.",
      echelons: [
        { echelon: 8, date: "01/03/2027", motif: "bonification d'ancienneté", d: D("01/03/2027") },
        { echelon: 8, date: "01/09/2027", motif: "ancienneté", d: D("01/09/2027") },
      ],
    },
    pres: { lignes: [
      "Mouvement interdépartemental : la saisie des vœux est ouverte jusqu'au 2 décembre à 12 h.",
      "Pensez à consulter régulièrement votre messagerie académique.",
    ], liens: [{ label: "Messagerie académique", href: "#" }, { label: "Fiche pratique", href: "#" }] },
    courrier: {
      nonLus: { "Carrière": 3, "Autres thèmes": 1 },
      messages: [
        msg("[signalé] Ouverture du mouvement national — rentrée 2027", "13/11/2026", "1", { nonLu: true, pj: true }),
        msg("Mouvement interdépartemental : consultation des barèmes", "06/11/2026", "1", { nonLu: true }),
        msg("Campagne d'entretiens de rendez-vous de carrière", "21/10/2026", "1", { nonLu: true, pj: true }),
        msg("Formation : inscriptions au plan départemental", "14/10/2026", "3", { nonLu: true }),
        msg("Évolution de la rémunération des congés de maladie ordinaire", "02/10/2026", "1"),
        msg("Postes restés vacants à l'issue du mouvement", "15/09/2026", "1", { pj: true }),
        msg("Contrôle annuel du supplément familial de traitement", "30/08/2026", "1", { pj: true }),
        msg("Phase d'ajustement du mouvement intra-départemental", "08/06/2026", "1"),
        msg("Campagne des postes à exigences particulières", "13/04/2026", "1", { pj: true }),
        msg("Circulaire tableau d'avancement hors classe", "27/03/2026", "1", { pj: true }),
        msg("[signalé] Ouverture du mouvement national — rentrée 2026", "28/10/2025", "1", { pj: true }),
        msg("Rappel : la plateforme SIAM est ouverte jusqu'à fin novembre", "24/11/2025", "1"),
        msg("Mouvement intra-départemental : calendrier", "17/03/2025", "1"),
      ],
    },
    affect: {
      quotite: "Votre quotité de service est de 100 %",
      lignes: [
        { actuelle: true, du: "01/09/2021", au: "", etab: "École maternelle Les Tilleuls, Ville-Exemple", rep: true, repLabel: "Réseau d'éducation prioritaire", circo: "Circonscription Exemple-Nord", nature: "Affectation à titre définitif", fonctions: [{ fonction: "enseignant classe préélémentaire", quotite: 100, principale: true, periode: "" }], sous: [], periode: "" },
        { actuelle: false, du: "01/09/2017", au: "31/08/2021", etab: "Zone de remplacement Exemple-Nord", rep: false, repLabel: "", circo: "Circonscription Exemple-Nord", nature: "Affectation à titre définitif", fonctions: [{ fonction: "titulaire remplaçant", quotite: 100, principale: true, periode: "" }], sous: [{}, {}, {}, {}, {}], periode: "" },
        { actuelle: false, du: "01/09/2015", au: "31/08/2017", etab: "École élémentaire Les Peupliers, Bourg-Exemple", rep: true, repLabel: "Réseau d'éducation prioritaire +", circo: "Circonscription Exemple-Sud", nature: "Affectation à titre provisoire", fonctions: [{ fonction: "enseignant classe élémentaire", quotite: 100, principale: true, periode: "" }], sous: [], periode: "" },
        { actuelle: false, du: "01/09/2014", au: "31/08/2015", etab: "École élémentaire Jules-Exemple, Village-Exemple", rep: false, repLabel: "", circo: "Circonscription Exemple-Ouest", nature: "Fonctionnaire stagiaire", fonctions: [], sous: [], periode: "" },
      ],
    },
    dip: {
      diplomes: [
        { Type: "Diplôme universitaire", "Spécialité": "Sciences de l'éducation", Diplôme: "Master MEEF", Libellé: "Master métiers de l'enseignement", Année: "2014" },
        { Type: "Diplôme professionnel", "Spécialité": "Anglais", Diplôme: "", Libellé: "Habilitation langues vivantes", Année: "2016" },
      ],
      titres: [{ Libellé: "HABILITATION ANGLAIS", "Date de Début": "05/05/2016", "Date de Fin": "" }],
    },
    form: [{ titre: "Formations suivies de courte durée", items: [
      { titre: "CONSTRUCTION DU NOMBRE AU CYCLE 1", org: "DSDEN" },
      { titre: "LANGAGE ORAL EN MATERNELLE", org: "Circonscription" },
      { titre: "ÉVALUER PAR COMPÉTENCES", org: "Circonscription" },
    ] }],
    services: [
      { kind: "form", nom: "SIAM", description: "Déposer et suivre une demande de mutation inter et intra-académique.", inputs: [] },
      { kind: "link", nom: "SIAE", description: "Gérer vos rendez-vous de carrière.", href: "#" },
      { kind: "link", nom: "Guide des rendez-vous de carrière", description: "Consulter le guide et la notice.", href: "#" },
      { kind: "link", nom: "SIAD", description: "S'informer sur le détachement.", href: "#" },
    ],
  };
})();

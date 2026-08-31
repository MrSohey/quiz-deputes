# Quiz des députés de l'Assemblée nationale

Jeu web : on montre le portrait officiel d'un député **actuellement en exercice**, le
joueur doit retrouver **son nom** et **son groupe politique à l'Assemblée**. En cas
d'échec, le jeu délivre des indices successifs. En cas de réussite, on enchaîne.

Ce fichier est la référence unique du projet : lis-le entièrement avant de coder, et
mets-le à jour quand une décision structurante change.

Le projet est le petit frère de **quiz-ministres** et en reprend l'architecture. Les
différences sont listées au §0 : les lire avant de recopier quoi que ce soit.

---

## 0. Ce qui change par rapport à quiz-ministres

| Point              | quiz-ministres                       | quiz-deputes                                    |
| ------------------ | ------------------------------------ | ----------------------------------------------- |
| Périmètre          | 1958 → aujourd'hui, ~500 personnes   | **les 577 en exercice**, et eux seuls           |
| Deuxième réponse   | un ministère parmi plusieurs occupés | **le groupe politique**, un seul possible       |
| Niveaux            | trois viviers gigognes               | trois aussi, mais sur une **échelle figée**     |
| Indices            | six                                  | **trois** : circonscription, famille, initiales |
| Source des données | Wikidata + Wikipédia                 | **Assemblée nationale seule**                   |
| Licence des photos | libre (Commons)                      | **non libre** : voir §6.3, c'est LE point dur   |
| Fraîcheur          | base historique, stable              | **périssable** : la composition bouge           |

Les deux derniers points sont structurants et n'ont pas d'équivalent dans l'autre
projet. Ne pas les traiter en fin de parcours.

---

## 1. Contraintes non négociables

| Contrainte            | Décision                                                                      |
| --------------------- | ----------------------------------------------------------------------------- |
| Langage               | TypeScript strict, partout (y compris les scripts de données)                 |
| Lisibilité            | Code reprenable par un humain non-expert : noms explicites, fonctions courtes |
| Coût                  | **0 €** : pas d'hébergement payant, pas de domaine, pas de base managée       |
| Backend               | **Aucun.** Application 100 % statique                                         |
| Photos                | **Non hébergées** : liens directs vers assemblee-nationale.fr (§6.3)          |
| Usage                 | **Non commercial**, sans publicité — imposé par les mentions légales (§6.3)   |
| Hébergement           | GitHub Pages, déploiement par GitHub Actions                                  |
| Langue de l'interface | Français                                                                      |
| Langue du code        | Anglais (identifiants, commentaires, commits)                                 |

### Anti-objectifs

- Pas de compte, pas d'authentification, pas de backend, pas de classement en ligne.
- Pas de state manager global : `useReducer` suffit.
- Pas de framework CSS : du CSS écrit à la main.
- Pas d'appel réseau au runtime en dehors du **chargement des images** (§6.3). Les
  données textuelles sont figées dans `deputies.json` au moment du build.
- **Pas de publicité, jamais.** Ce n'est pas une préférence : les mentions légales de
  l'Assemblée interdisent l'usage publicitaire de leurs contenus.
- Pas de jugement éditorial sur les personnes. Le jeu affiche des faits publics.

---

## 2. Stack

Identique à quiz-ministres, et pour les mêmes raisons :

- **Vite** + **React 18** + **TypeScript** (`strict: true`, `noUncheckedIndexedAccess`).
- **Vitest** pour la logique pure.
- **Zod** pour valider `deputies.json` au build et dans les tests.
- **CSS simple**, variables CSS natives. Pas de Tailwind, pas de CSS-in-JS.
- **ESLint** (config plate) avec `typescript-eslint` typé et `eslint-plugin-react-hooks`.
- **Prettier** pour le formatage, vérifié en CI. Prettier met en forme, ESLint corrige.
- **npm**, Node ≥ 24.

`data/deputies.json` est dans `.prettierignore` : il est produit par un script et sa
structure est déjà garantie par le schéma Zod.

Écrire soi-même la distance de Levenshtein (~20 lignes) plutôt qu'ajouter une
dépendance.

---

## 3. Structure du repo

```
.
├── CLAUDE.md
├── README.md
├── index.html
├── vite.config.ts                 # base: '/quiz-deputes/'
├── package.json
├── eslint.config.js
├── .github/workflows/
│   ├── ci.yml                     # format + lint + types + tests + build
│   ├── deploy.yml                 # publication sur GitHub Pages
│   └── check-freshness.yml        # contrôle hebdomadaire (§5.2)
├── data/
│   ├── deputies.json              # LA base, régénérée par script
│   ├── difficulty.json            # échelle figée + ses deux signaux (§7.9)
│   ├── aliases.json               # noms alternatifs saisis à la main
│   └── deputies.schema.ts         # schéma Zod + types dérivés
├── scripts/
│   ├── fetch-deputies.ts          # CSV open data → deputies.json
│   ├── check-photo-links.ts       # HEAD sur chaque portrait
│   └── validate-data.ts           # échoue si le JSON est invalide
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── game/
    │   ├── types.ts
    │   ├── photoUrl.ts            # URL du portrait à partir de l'identifiant AN
    │   ├── deck.ts                # ordre de passage : mélange unique du vivier
    │   ├── seed.ts                # aléa reproductible, empreinte du vivier
    │   ├── challenge.ts           # encodage du défi dans l'URL
    │   ├── groups.ts              # table des groupes : libellés, alias, sigles
    │   ├── levels.ts              # niveaux de difficulté et filtrage du vivier
    │   ├── matching.ts            # normalisation + comparaison des réponses
    │   ├── hints.ts               # échelle d'indices
    │   ├── scoring.ts
    │   ├── issueUrl.ts            # signalement d'erreur en issue GitHub
    │   └── reducer.ts
    ├── components/
    │   ├── LevelPicker.tsx        # choix du niveau (§7.9)
    │   └── ReportErrorForm.tsx    # signalement d'erreur (§7.8)
    └── styles/
```

---

## 4. Modèle de données

### 4.1 Une fiche = un député en exercice

Pas de notion de mandat multiple, pas d'historique. Un député siège dans **un seul**
groupe à un instant donné : la deuxième réponse est donc unique, contrairement à
quiz-ministres où plusieurs ministères étaient acceptés.

### 4.2 Types

```ts
/** Identifiant de l'Assemblée nationale, tel quel. Ex. "795998". */
type DeputyId = string;

/** Groupe politique. La liste est celle de la XVIIe législature (§7.4). */
type GroupId =
  | "rn" // Rassemblement National
  | "epr" // Ensemble pour la République
  | "lfi-nfp" // La France insoumise – Nouveau Front Populaire
  | "soc" // Socialistes et apparentés
  | "dr" // Droite Républicaine
  | "ecos" // Écologiste et Social
  | "dem" // Les Démocrates
  | "hor" // Horizons & Indépendants
  | "liot" // Libertés, Indépendants, Outre-mer et Territoires
  | "gdr" // Gauche Démocrate et Républicaine
  | "udr" // Union des droites pour la République
  | "ni"; // Non inscrit — absence de groupe, pas un groupe

type PoliticalFamily = "gauche" | "centre" | "droite" | "extreme-droite";

interface Deputy {
  id: DeputyId;
  firstName: string;
  lastName: string;
  /** Formes alternatives acceptées : nom d'usage, particule, orthographe courante. */
  aliases: string[];
  group: GroupId;
  /** Département ou collectivité, tel qu'écrit par l'Assemblée. Ex. "Ariège". */
  department: string;
  /** Numéro de circonscription dans le département. */
  constituency: number;
  /** Profession déclarée. Sert à la page de crédits, pas au jeu. */
  profession: string | null;
  /** URL de la fiche officielle, pour vérification humaine. Obligatoire. */
  sourceUrl: string;
}
```

Pas de champ `photo` : l'URL du portrait se **déduit** de l'`id` (§6.3). Stocker une
URL qu'on peut calculer serait une occasion de divergence.

Le champ `difficulty` (1 à 3) vient de `data/difficulty.json` et **ne se recalcule
pas** : voir §7.9.

### 4.3 Règles de qualité

- **Aucune donnée inventée.** Tout vient du fichier open data de l'Assemblée.
- `deputies.json` est **régénéré**, pas édité à la main : c'est l'inverse de
  quiz-ministres. Une correction manuelle serait écrasée à la prochaine mise à jour.
  Ce qui doit survivre à une régénération — les `aliases` — vit dans un fichier
  séparé, `data/aliases.json`, fusionné par le script.
- `scripts/validate-data.ts` vérifie le schéma, l'unicité des `id`, et **fait échouer
  le build** sinon. Il tourne aussi en CI.

---

## 5. Périmètre et fraîcheur

### 5.1 Périmètre

**Les 577 députés en exercice**, et eux seuls. Ni les anciens, ni les suppléants, ni
les députés européens.

Un député sans portrait publié sur le site de l'Assemblée n'entre pas dans la base :
une manche sans photo n'a pas de sens. Le cas doit rester rare et être journalisé.

### 5.2 La base est périssable — et c'est la difficulté propre à ce projet

La composition de l'Assemblée bouge en permanence : démissions, décès, élections
partielles, entrées au Gouvernement (le suppléant prend le siège), et surtout
**changements de groupe**, qui sont fréquents et qui changent la bonne réponse.

Trois conséquences à traiter dès le départ :

1. `scripts/fetch-deputies.ts` doit être **idempotent** et rejouable en une commande.
2. `.github/workflows/check-freshness.yml` retélécharge le CSV chaque semaine, le
   compare à `deputies.json` et **ouvre une issue** en cas d'écart, avec le détail.
   Il ne commite rien tout seul : une réponse fausse est un bug visible, une mise à
   jour automatique non relue en est un invisible.
3. `deputies.json` porte un champ de tête `fetchedAt` (date ISO). L'interface affiche
   discrètement « données au JJ/MM/AAAA » sur la page de crédits. Un joueur qui trouve
   une réponse fausse doit pouvoir comprendre pourquoi.

---

## 6. Constitution de la base

### 6.1 Source unique : l'Assemblée nationale

Wikipédia n'est pas nécessaire, et ne doit pas être utilisée : l'Assemblée publie
elle-même, en open data, tout ce dont le jeu a besoin.

### 6.2 Le fichier open data

```
https://data.assemblee-nationale.fr/static/openData/repository/17/amo/
    deputes_actifs_csv_opendata/liste_deputes_excel.csv
```

577 lignes, une par député. Colonnes utiles :

| Colonne                      | Usage                                     |
| ---------------------------- | ----------------------------------------- |
| `identifiant`                | `id`, et surtout l'URL du portrait (§6.3) |
| `Prénom`, `Nom`              | la première réponse                       |
| `Département`                | indice n°1                                |
| `Numéro de circonscription`  | indice n°1                                |
| `Groupe politique (complet)` | la seconde réponse                        |
| `Groupe politique (abrégé)`  | le sigle, accepté en réponse (§7.4)       |
| `Profession`                 | non utilisé par le jeu                    |

⚠️ **Deux pièges vérifiés sur le fichier réel :**

- il est encodé en **cp1252**, pas en UTF-8. Le lire en UTF-8 échoue sur « Émeline » ;
- le séparateur est le **point-virgule**.

Le numéro de législature (`17`) est dans l'URL : il faudra le changer à la
législature suivante. Le mettre dans une constante nommée, pas en dur au milieu du
script.

L'URL de la fiche officielle se construit ainsi :

```
https://www.assemblee-nationale.fr/dyn/deputes/PA{identifiant}
```

C'est la forme **canonique**, vérifiée : la variante `www2…/deputes/fiche/OMC_PA…`
qu'on trouve dans les listes n'est qu'une redirection vers celle-ci, et la même
adresse sur `www` sans `/dyn/` renvoie 404. Pointer directement sur la forme
canonique évite un aller-retour et un lien qui casse.

### 6.3 Photos — le point dur du projet

**C'est la question à trancher avant d'écrire une ligne de code.** Elle a été
instruite ; voici l'état du droit, sourcé.

#### Ce que disent les mentions légales

Page [assemblee-nationale.fr/dyn/info-site](https://www.assemblee-nationale.fr/dyn/info-site),
section « Utilisation de documents ou de ressources multimédia » :

> « Les documents "publics" ou "officiels" ne sont couverts par aucun droit d'auteur
> (article L.122-5 du code de la propriété intellectuelle). Ils peuvent donc être
> reproduits librement. […] Les informations utilisées ne doivent l'être qu'à des fins
> personnelles, associatives ou professionnelles, toute utilisation ou reproduction à
> des fins commerciales ou publicitaires étant interdite. »

Puis, sans ambiguïté :

> « **Les graphismes, photographies et ressources multimédias ne peuvent être
> reproduits sans accord préalable** et sous respect de leur non-diffusion à des fins
> commerciales ou publicitaires. »

Le pied de page porte « ©Tous droits réservés Assemblée nationale ». Les crédits
photo annoncés sont « Assemblée nationale – Shutterstock – Istock ».

Enfin, section « Création de liens » :

> « Le site de l'Assemblée nationale **autorise tout site Internet ou tout autre
> support à le citer ou à mettre en place un lien hypertexte pointant vers son
> contenu.** » — l'autorisation vaut pour tout site, sauf ceux à caractère polémique,
> pornographique ou xénophobe, ou portant préjudice à l'Assemblée et à ses membres.

#### Ce qu'on en retient

Trois faits, qu'il ne faut pas mélanger :

1. **Les données textuelles sont libres.** Le CSV du §6.2 est publié sous **Licence
   Ouverte / Etalab**. Noms, circonscriptions et groupes ne posent aucun problème.
2. **L'open data ne contient aucune photo.** Les portraits ne sont pas dans le jeu de
   données ; ils ne sont donc pas couverts par la Licence Ouverte.
3. **Copier les portraits est interdit sans accord préalable.** La galerie « photos
   libres de droits » de l'espace presse ne concerne que des vues des lieux
   (hémicycle, Palais Bourbon), pas les portraits.

#### La décision : lier, jamais copier

**Les portraits ne sont ni téléchargés, ni stockés, ni redistribués.** Ils sont
chargés directement depuis le serveur de l'Assemblée, par une balise `<img>` :

```ts
const AN_PHOTOS = "https://www.assemblee-nationale.fr/dyn/static/tribun/17/photos/carre/";

/** Le portrait carré officiel. Vérifié : 200, image/jpeg, ~50 Ko. */
export function photoUrl(id: DeputyId): string {
  return `${AN_PHOTOS}${encodeURIComponent(id)}.jpg`;
}
```

Le raisonnement : l'interdiction porte sur la **reproduction**, et lier n'est pas
reproduire — aucune copie n'est faite de notre côté, l'image reste servie par
l'Assemblée, qui la publie librement et qui **autorise expressément les liens vers
son contenu**. La jurisprudence européenne (CJUE, _Svensson_ et _BestWater_) va dans
ce sens : renvoyer vers un contenu déjà librement accessible n'est pas une nouvelle
communication au public.

#### ⚠️ La réserve, à énoncer et non à masquer

Ce raisonnement n'est **pas certain**. Deux objections sérieuses :

- une balise `<img>` fait plus que renvoyer : elle **affiche** l'image dans notre page,
  ce qu'un juriste français peut analyser comme une représentation ;
- l'autorisation de « mettre en place un lien hypertexte » a vraisemblablement été
  rédigée en pensant aux liens de navigation, pas à l'inclusion d'images.

**Le remède a été pris : un courriel à `communication@assemblee-nationale.fr`**,
l'adresse que les mentions légales donnent elles-mêmes pour ces demandes. Il décrit
le projet tel qu'il est — jeu gratuit, sans publicité, non commercial, portraits
affichés par lien et non copiés, source et lien vers la fiche officielle sur chaque
écran — et attend réponse.

La demande a été envoyée et **attend réponse**. La publication ne l'attend pas : le
raisonnement ci-dessus est assez solide pour tenir, l'usage reste gratuit, non
commercial et sans publicité, et un refus se traiterait en basculant la source des
images vers Wikimedia Commons, où 93 % des députés ont un portrait libre. Rien n'est
donc irréversible.

#### Si l'autorisation est refusée

Ne pas contourner. Le repli est **Wikimedia Commons**, et il a été mesuré plutôt
qu'estimé — le chiffre change tout, alors autant le connaître avant d'en avoir besoin.

**539 députés sur 577 auraient une fiche complète, soit 93 %.** Le vivier ne fond pas,
il s'érode. Motifs d'exclusion, mesurés le 27 août 2026 :

| Motif                         | Députés |
| ----------------------------- | ------- |
| Aucune image sur Wikidata     | 36      |
| Licence GFDL 1.2, non retenue | 1       |
| Crédit inexploitable          | 1       |

Les critères appliqués sont ceux de quiz-ministres : licence libre, et crédit
utilisable — un auteur nommé de moins de 120 caractères, pas un gabarit Commons
recopié. Les licences rencontrées sont sans surprise : 344 en CC BY-SA 4.0, 97 en
CC BY 4.0, 38 en CC0, le reste en variantes CC.

**Les niveaux survivent presque intacts**, ce qui est le point décisif pour la
jouabilité :

| Niveau        | Couverture     |
| ------------- | -------------- |
| Facile        | 127/130 — 98 % |
| Intermédiaire | 167/170 — 98 % |
| Difficile     | 245/277 — 88 % |

Les manquants se concentrent au niveau 3, chez les moins connus : personne n'a pris
la peine d'illustrer leur article. Aucun groupe n'est sacrifié — de 87 % pour EPR à
100 % pour LIOT, UDR, GDR et les non-inscrits.

##### Ce que ce repli coûte vraiment

Ce n'est pas le nombre de fiches, contrairement à ce que ce paragraphe affirmait
avant mesure. Trois autres coûts, eux, sont réels :

- **une dépendance à Wikidata apparaît**, alors que le §6.1 pose l'Assemblée comme
  source unique. C'est le vrai prix architectural ;
- **les photos changent de nature.** Les portraits de l'Assemblée sont homogènes —
  même cadrage, même fond. Ceux de Commons sont hétéroclites : meetings,
  conférences, clichés anciens. Le jeu devient un peu plus difficile et visuellement
  moins net ;
- **le modèle de données s'alourdit** d'un champ `photo` portant nom de fichier,
  crédit et licence, et d'une page de crédits nourrie. Aucune inconnue technique
  cependant : c'est exactement le modèle de quiz-ministres, avec `Special:FilePath`
  qui résiste aux renommages sur Commons.

Deux replis de second rang, si celui-là ne convenait pas :

1. **Changer de question** : silhouette du département, hémicycle, ou un jeu « nom →
   groupe » sans photo. Le concept change, mais rien n'est illégal.
2. **Abandonner.** C'est une option, et elle vaut mieux qu'un contentieux.

#### Obligations dans tous les cas

- **Aucune publicité, aucun usage commercial.** Interdit explicitement.
- Une page « Crédits » citant l'Assemblée nationale comme source des données et des
  portraits, la Licence Ouverte pour les données, et la date de collecte.
- Un lien vers la **fiche officielle** du député à la révélation de chaque manche.
- `scripts/check-photo-links.ts` fait un `HEAD` hebdomadaire sur chaque portrait et
  signale les 404. Envoyer un `User-Agent` descriptif et espacer les requêtes : on est
  invité chez quelqu'un.

---

## 7. Logique de jeu

### 7.1 Boucle

```
[Accueil] → [Manche] ⇄ [Indice] → [Révélation] → [Manche suivante] … → [Fin]
```

Une **partie** = 10 manches (`ROUNDS_PER_GAME`). Une **manche** = un portrait, deux
réponses attendues : le nom, le groupe.

### 7.2 États d'une manche

```ts
type RoundStatus =
  | "asking" // le joueur cherche
  | "nameFound" // nom trouvé, groupe pas encore
  | "groupFound" // groupe trouvé, nom pas encore
  | "solved" // les deux trouvés
  | "revealed"; // abandon ou indices épuisés
```

Les deux réponses sont **indépendantes** : trouver le nom ne révèle pas le groupe.
Chaque champ trouvé se verrouille.

### 7.3 Ordre de passage

Mélange de Fisher-Yates du vivier entier **une seule fois au démarrage**, puis un
curseur. Aucune autre action ne tire au sort.

Ce n'est pas un raffinement : un générateur porte un état, et **React StrictMode
double-invoque les réducteurs en développement**. Un tirage par manche divergerait
entre développement et production, et fausserait tous les défis partagés. Un test de
double invocation verrouille la propriété.

### 7.4 Comparaison des réponses — `matching.ts` et `groups.ts`

Même moteur que quiz-ministres : normalisation commune, puis règles propres à chaque
champ. **Être généreux** est le principe directeur.

#### Normalisation

Minuscules ; suppression des accents (`NFD` + diacritiques) ; tirets et apostrophes
(droites et typographiques) remplacés par des espaces ; ponctuation restante
supprimée ; espaces compressés ; `trim`.

#### Le nom

Correct si la saisie égale le nom complet, le nom de famille seul, ou un alias ; ou si
la distance de Levenshtein sur le **nom de famille** tient dans le barème : longueur
≤ 5 → 0 ; 6-9 → 1 ; ≥ 10 → 2. Particules optionnelles des deux côtés.

⚠️ 577 noms, dont beaucoup de courts et de proches. Les tests doivent couvrir les
paires réellement présentes dans la base, pas des exemples inventés.

#### Le groupe

C'est la difficulté propre à ce jeu : **les intitulés officiels sont longs et personne
ne les cite exactement.** « Ensemble pour la République » est presque toujours appelé
« Renaissance », « macronistes » ou « EPR ».

La table vit dans `src/game/groups.ts` — dans le code, pas dans `deputies.json`,
parce qu'elle décrit un groupe et non une personne.

```ts
interface Group {
  id: GroupId;
  /** Intitulé officiel, affiché à la révélation. */
  officialLabel: string;
  /** Sigle officiel de l'Assemblée. Ex. "LFI-NFP". */
  officialAbbreviation: string;
  /** Formes courantes, usuelles, journalistiques. Tolérantes aux fautes. */
  aliases: string[];
  /** Sigles. Correspondance EXACTE uniquement. */
  acronyms: string[];
  family: PoliticalFamily | null;
}
```

Les douze groupes, avec leurs effectifs au moment de la rédaction :

| id        | Intitulé officiel                              | Sigle   | Effectif |
| --------- | ---------------------------------------------- | ------- | -------- |
| `rn`      | Rassemblement National                         | RN      | 122      |
| `epr`     | Ensemble pour la République                    | EPR     | 90       |
| `lfi-nfp` | La France insoumise – Nouveau Front Populaire  | LFI-NFP | 71       |
| `soc`     | Socialistes et apparentés                      | SOC     | 68       |
| `dr`      | Droite Républicaine                            | DR      | 48       |
| `ecos`    | Écologiste et Social                           | EcoS    | 38       |
| `dem`     | Les Démocrates                                 | Dem     | 37       |
| `hor`     | Horizons & Indépendants                        | HOR     | 36       |
| `liot`    | Libertés, Indépendants, Outre-mer, Territoires | LIOT    | 23       |
| `gdr`     | Gauche Démocrate et Républicaine               | GDR     | 17       |
| `udr`     | Union des droites pour la République           | UDR     | 17       |
| `ni`      | Non inscrit                                    | NI      | 10       |

Alias à prévoir, au minimum : « renaissance » et « macronistes » pour `epr` ;
« insoumis », « mélenchonistes » pour `lfi-nfp` ; « ps », « socialistes » pour `soc` ;
« lr », « les républicains » pour `dr` ; « modem » pour `dem` ; « communistes » pour
`gdr` ; « écologistes », « verts » pour `ecos` ; « lepénistes », « frontistes » pour
`rn` ; « ciottistes » pour `udr` ; « sans groupe », « aucun groupe » pour `ni`.

#### ⚠️ Les sigles ne tolèrent jamais les fautes

C'est le piège principal, et il est **pire ici que dans quiz-ministres** : `DR`, `GDR`
et `UDR` ne diffèrent que d'une lettre, `RN` et `NI` sont sur deux caractères. Une
tolérance de 1 les rendrait tous équivalents. Les sigles se comparent donc en
**égalité stricte**, et cette étape est terminale.

L'étape d'égalité avec les intitulés doit passer **avant** le rejet des sigles
inconnus, sinon « dem » ou « soc », qui sont aussi des mots, ne résoudraient rien.

#### Invariant anti-collision

`groups.test.ts` vérifie, **sur toute la table**, que chaque alias et chaque sigle
résout vers son propre groupe et vers aucun autre. Ce test doit exister **avant** de
remplir la table.

`ni` demande une attention particulière : « non inscrit » n'est pas un groupe mais
l'absence de groupe. On l'accepte quand même comme réponse, parce que c'est ce que le
joueur a à l'esprit — mais l'indice de famille politique est escamoté (§7.5).

### 7.5 Indices — `hints.ts`

Trois indices, dans cet ordre. Le joueur les demande explicitement.

| #   | Indice            | Exemple                        | Condition         |
| --- | ----------------- | ------------------------------ | ----------------- |
| 1   | Circonscription   | « Ariège, 2ᵉ circonscription » | toujours          |
| 2   | Famille politique | « Famille politique : gauche » | `family !== null` |
| 3   | Initiales         | « A. A.-A. »                   | toujours          |

Après le troisième, le bouton devient « Donner la réponse ». Les indices obtenus
restent affichés pendant toute la manche.

L'indice 2 est **escamoté** pour les non-inscrits, qui n'ont pas de famille de groupe :
ces dix députés n'ont alors que deux indices. C'est peu, et c'est assumé — inventer une
étiquette politique pour une personne qui a précisément choisi de n'en pas porter
serait une faute. `maxHintsFor(deputy)` donne le nombre réel, et le compteur du bouton
suit : « Indice (1/2) ».

#### La famille politique est un choix éditorial, à assumer comme tel

Le classement gauche / centre / droite / extrême droite est un **jugement**, pas une
donnée de l'Assemblée. Il vit donc dans `groups.ts`, en clair, relisable et
contestable — jamais dans les données.

Deux cas demandent d'écrire pourquoi, en commentaire, dans le code :

- **LIOT** est un groupe hétérogène par construction, qui rassemble des élus de
  sensibilités différentes. Lui attribuer une famille unique est discutable ; si le
  choix retenu est de le laisser à `null`, l'indice s'escamote comme pour les
  non-inscrits, et c'est la solution la plus honnête.
- **UDR** : le classer relève d'une appréciation sur laquelle les commentateurs ne
  s'accordent pas. Retenir le positionnement revendiqué par le groupe lui-même, le
  documenter, et s'y tenir.

Règle générale : en cas de doute réel, `null` et indice escamoté. Le jeu perd un
indice ; il ne perd pas sa crédibilité.

### 7.6 Défi partageable — `seed.ts`, `challenge.ts`

Un lien rejoue exactement la même partie :

```
https://…/quiz-deputes/?defi=facile.uuhy9b.13q47wh
                             └niveau┘└graine┘└empreinte┘
```

Le niveau fait partie du lien : sans lui, la même graine appliquée à un autre vivier
donnerait une autre partie. L'empreinte porte donc, elle aussi, sur le vivier **du
niveau** et non sur les 577.

L'URL est écrite dès la première manche par `replaceState` — jamais `pushState`, qui
empilerait une entrée par partie. Conséquence assumée : recharger la page rejoue la
même partie.

**L'empreinte du vivier compte double ici.** Une graine fige le tirage, pas les
données, et la composition de l'Assemblée bouge (§5.2). Un défi partagé en janvier ne
donnera pas la même partie en mars si trois députés ont changé de groupe.
`poolFingerprint` hache les identifiants ; si l'empreinte reçue ne correspond plus, un
bandeau prévient le joueur au lieu de lui promettre à tort une partie identique.

### 7.7 Score — `scoring.ts`

- Nom trouvé : **50 points**. Groupe trouvé : **50 points**.
- Chaque indice utilisé : **−10 points** sur le total de la manche (plancher 0).
- Manche révélée sans réponse : 0 point.
- Bonus de série : +25 points par manche résolue **sans aucun indice**, cumulatif
  au-delà de 2 manches consécutives.

**Persistance** : `localStorage`, uniquement le meilleur score **par niveau**
(`quiz-deputes:best-score:<niveau>`). Un score unique n'aurait pas de sens : les trois
viviers n'ont pas la même difficulté.

**Aucun cookie**, donc aucune bannière de consentement. C'est un choix d'architecture :
l'exemption de l'ePrivacy (art. 5-3) porte sur la finalité, et un score local,
first-party, sans traçage, y entre. Toute évolution qui introduirait de l'analytics ou
un classement en ligne ferait basculer le site hors de cette exemption.

Accès à `localStorage` enveloppés dans un `try/catch` : en navigation privée, le jeu
doit rester jouable.

### 7.8 Signalement d'erreur — `game/issueUrl.ts`

Le besoin est plus fort ici que dans quiz-ministres, et pour une raison de fond : la
base est **périssable** (§5.2). Un joueur à qui le jeu refuse une bonne réponse est
souvent le premier à savoir qu'un député a changé de groupe.

Le bouton est dans **`RevealPanel`**, et nulle part ailleurs : c'est le seul écran où
la fiche est déjà visible, donc le seul où l'afficher ne divulgue pas la réponse.

Sans backend (§1), le jeu ne peut ni recevoir ni stocker un signalement. On délègue à
**GitHub** : le lien ouvre le formulaire de création d'issue pré-rempli. Rien n'est
envoyé tant que la personne n'a pas validé.

Le corps porte l'**identifiant de la fiche** en premier, puis le nom, le groupe, la
circonscription, la fiche officielle — et la **date de collecte**, qui suffit souvent
à conclure sans enquête : l'« erreur » est fréquemment une donnée qui a vieilli.

Trois pièges, tous couverts par `issueUrl.test.ts` :

- **Borner les caractères ne borne pas l'URL.** Un caractère accentué s'encode sur
  six (`%C3%A9`) : 1500 caractères de français produisaient un lien de 10 000
  caractères, au-delà de la limite d'environ 8 ko de GitHub, qui renvoie alors une
  erreur au lieu du formulaire. `MAX_MESSAGE_LENGTH` vaut donc 750, et un test
  éprouve l'invariant **sur la base réelle** avec le message le plus coûteux possible.
- **Toujours passer par `URLSearchParams`.** Le corps est multi-lignes et plein
  d'apostrophes : une concaténation à la main casserait l'URL au premier `\n`.
- **Remonter le formulaire à chaque personne** (`key={deputy.id}`), sinon un texte
  saisi sur une fiche resterait attaché à la suivante.

Le déclencheur final est un `<a target="_blank">` et non un `window.open` : une
navigation issue d'un clic passe les bloqueurs de fenêtres. Le champ reste
**facultatif** — une fiche identifiée sans commentaire est déjà exploitable.

⚠️ Le label `donnée` référencé par le lien doit exister dans le dépôt, sans quoi le
formulaire s'ouvre sur un label inconnu. À créer au moment de la mise en ligne.

### 7.9 Niveaux de difficulté — `game/levels.ts`

Trois viviers **gigognes** : Facile ⊂ Intermédiaire ⊂ Difficile. Monter de niveau,
c'est retrouver les députés déjà connus noyés dans un ensemble plus large ; un joueur
ne perd jamais ce qu'il a appris.

| Niveau        | Vivier      |
| ------------- | ----------- |
| Facile        | 130 députés |
| Intermédiaire | 300 députés |
| Difficile     | les 577     |

#### L'échelle est FIGÉE, et c'est le point à ne pas défaire

`data/difficulty.json` porte le niveau de chaque député **et les deux signaux qui
l'ont produit**. Le fichier ne se recalcule pas.

La raison est de fond : la notoriété dérive de mois en mois, mais une difficulté
mouvante casserait la comparaison des scores et rendrait un défi partagé irreproductible.
Le jeu a déjà une pièce mobile — la composition de l'Assemblée (§5.2) — et une seconde
serait de trop.

Comme les alias, la difficulté vit **hors** de `deputies.json` : ce dernier est
régénéré à chaque mise à jour de la composition, et l'écraserait. `fetch-deputies.ts`
la refusionne, et **range au niveau 3** tout député absent de l'échelle — un nouvel
arrivant n'a pas de notoriété qu'on puisse lui inventer. Le script le signale.

#### Comment l'échelle a été établie

Deux signaux, choisis parce qu'ils **se trompent différemment** : leur corrélation de
rang n'est que de 0,46.

- la **médiane mensuelle** des consultations de l'article Wikipédia, sur douze mois.
  La médiane et non le total : un pic d'actualité gonfle le total sans rien dire de la
  notoriété durable — 71 % des vues d'un député tenaient dans un seul mois ;
- le **nombre de versions linguistiques** de l'article, insensible aux pics mais
  aveugle au milieu du classement, où 65 % des députés se tiennent en trois ou quatre
  langues.

Chacun est converti en centile, puis combiné **0,7 / 0,3** — la consultation gradue
tout le classement, les langues ne servent qu'à relever ceux dont la notoriété dépasse
la France.

Quatre appartenances d'office au niveau 1 — **69 députés** au total —, chacune
rattrapant une notoriété que les deux métriques manquent :

- les **présidents de groupe** (11), dont la notoriété est institutionnelle ;
- les **anciens ministres** (21), dont la notoriété vient d'ailleurs que de
  l'Assemblée. Repérés en croisant `quiz-ministres/data/ministers.json` par
  identifiant Wikidata — aucun appariement de noms, aucune requête supplémentaire ;
- les **dirigeants de parti** (11), que l'Assemblée ne publie pas : son open data ne
  connaît que l'appartenance à un parti, jamais la fonction qu'on y occupe. Wikidata
  la porte, sous deux propriétés selon les partis, les intitulés variant — président,
  premier secrétaire, coordinateur ;
- les députés à **quatre mandats ou plus** (39), soit vingt ans de présence.

Ce dernier critère n'est pas là que pour lui-même : l'ancienneté favorise les partis
installés là où la popularité favorise LFI et les écologistes. Les deux biais étant
opposés, les combiner resserre l'écart entre groupes — la part du groupe socialiste
en Facile passe de 10 % à 19 %, celle de la Droite Républicaine de 15 % à 31 %, tandis
que LFI redescend de 46 % à 41 %.

⚠️ Deux limites de ces critères, à connaître : l'historique de l'Assemblée ne remonte
qu'à 1997, donc les carrières antérieures sont sous-estimées ; et « dirigeant de
parti » inclut des chefs de micro-partis dont la notoriété est nulle — trois cas, tous
retenus, parce que filtrer les partis « qui comptent » serait précisément le jugement
éditorial qu'on cherche à éviter.

#### Ce que l'échelle ne fait pas

Elle ne mesure pas la reconnaissance d'un **visage**, mais l'attention portée à un
**nom**. Aucune donnée publique ne mesure la première ; seul le taux d'échec des
joueurs le ferait, ce qui suppose un backend et sort du périmètre (§1).

Elle reste **inégale entre groupes**, malgré la correction par l'ancienneté : le
niveau Facile va de 9 % du groupe RN à 41 % du groupe LFI. C'est mécanique et non
éditorial, mais cela se voit, et il faut le savoir avant de défendre le choix.

---

## 8. Interface

### 8.1 Écran de manche

```
┌──────────────────────────────────────────┐
│  Manche 3/10             Score : 180  ⭐×2│
├──────────────────────────────────────────┤
│            [  PORTRAIT  ]                 │
├──────────────────────────────────────────┤
│  Qui est-ce ?                             │
│  [ ______________________ ]               │
│  Dans quel groupe siège cette personne ?  │
│  [ ______________________ ]               │
│   ↳ suggestions non contraignantes        │
│                                           │
│  [ Valider ]  [ Indice (1/3) ]  [ Passer ]│
├──────────────────────────────────────────┤
│  💡 Ariège, 2ᵉ circonscription            │
└──────────────────────────────────────────┘
```

### 8.2 Écran de révélation

Nom complet, groupe (intitulé officiel + sigle), circonscription, puis la mention de
la source et un lien « Voir la fiche officielle » vers `sourceUrl`.

### 8.3 Règles d'UI

- **Mobile-first.** Portrait et champs tiennent sur un écran de téléphone sans scroll.
- Le champ « nom » a le focus au début de chaque manche ; `Entrée` valide.
- Le champ « groupe » propose des suggestions (`<datalist>` natif, pas de librairie)
  mais **n'impose rien** : la validation part du texte saisi.
- **Précharger le portrait suivant** dès que la manche courante démarre.
- Réserver la place de l'image (`aspect-ratio`) pour éviter les sauts de mise en page.
- `onError` sur l'image : ne pas afficher de manche cassée, journaliser l'`id` et
  enchaîner sur la personne suivante.
- Feedback immédiat et non punitif. Jamais de son par défaut.
- **Formulation neutre en genre** : « cette personne », « qui est-ce ? ». Ne jamais
  déduire le genre d'un prénom. L'Assemblée fournit une civilité ; ne pas l'utiliser
  dans les questions, seulement à la révélation si nécessaire.

### 8.4 Accessibilité

- `alt` neutre qui ne divulgue pas la réponse : `alt="Portrait de la personne à identifier"`.
- Labels explicites, navigation clavier complète, focus visible.
- Contrastes AA minimum. Le vert/rouge est toujours doublé d'une icône ou d'un texte.
- **Ne pas colorer les groupes par leur couleur politique** : les contrastes deviennent
  ingérables et l'écran prend une charge politique inutile.
- Respecter `prefers-reduced-motion`.

---

## 9. Tests

Vitest, sur la logique pure.

- `matching.test.ts` : normalisation, nom seul, alias, fautes tolérées, **et rejet des
  noms proches mais différents**.
- `groups.test.ts` — le plus important :
  - cas de référence pour `epr` : « Ensemble pour la République », « renaissance »,
    « epr », « macronistes » résolvent tous vers le même id ;
  - **invariant anti-collision sur toute la table** ;
  - rejet des sigles approchants : « dr », « gdr », « udr » ne doivent jamais se
    confondre ; « rn » et « ni » non plus ;
  - rejet des mots non discriminants isolés : « républicaine », « social »,
    « indépendants » ne résolvent vers rien.
- `deck.test.ts` : aucune répétition dans une partie, tirage déterministe à graine fixe.
- `scoring.test.ts` : points, malus, plancher, bonus de série.
- `reducer.test.ts` : transitions, indices épuisés → `revealed`, fin de partie,
  **double invocation** (§7.3).
- `data.test.ts` : `deputies.json` valide le schéma, ids uniques, 577 fiches, chaque
  `group` existe dans la table, chaque `department` est non vide. **Sans réseau.**
- `photoUrl.test.ts` : URL correcte, encodage de l'identifiant.

Injecter la source d'aléa (`rng: () => number`) plutôt qu'appeler `Math.random()`.

---

## 10. Intégration continue

`ci.yml` sur chaque PR et sur `main`. Cinq jobs en parallèle, plus un agrégateur `CI`
qui les rassemble par `needs` — **seul `CI` est déclaré « required »** dans les règles
de branche : ajouter un contrôle plus tard ne demandera pas de toucher aux réglages
du dépôt.

| Job    | Commande                           |
| ------ | ---------------------------------- |
| Format | `npm run format:check`             |
| Lint   | `npm run lint`                     |
| Types  | `npm run typecheck`                |
| Tests  | `npm run validate` puis `npm test` |
| Build  | `npm run build`                    |

`npm run verify` rejoue la séquence en local, sans réseau.

**Ne sont volontairement pas bloquants** : `check-photo-links` et `check-freshness`,
qui dépendent d'un serveur tiers. Les rendre bloquants ferait échouer des merges
valides au moindre incident réseau.

---

## 11. Déploiement

GitHub Pages, avec `base: '/quiz-deputes/'` dans `vite.config.ts` — indispensable,
sinon les assets sont en 404 une fois publiés.

`deploy.yml` se déclenche à chaque poussée sur `main` et rejoue `npm run verify`
avant de construire. Redondance assumée avec la CI : `main` accepte les poussées
directes, qui ne passent par aucune revue.

Si l'Assemblée refusait l'usage de ses portraits (§6.3), le remède ne serait pas de
dépublier mais de **basculer la source des images vers Wikimedia Commons**. C'est
cette réversibilité qui rend la mise en ligne acceptable avant sa réponse.

---

## 12. Conventions de code

- `strict: true`, `noUncheckedIndexedAccess: true`. Zéro `any`. Les `as` se justifient.
- Fonctions pures dans `src/game/**` : aucune référence à React, au DOM, à `Date.now()`
  ou `Math.random()` non injectés.
- Les composants React ne contiennent que du rendu et du branchement d'événements.
- Un seul `useReducer` pour l'état de la partie, dans `App.tsx`.
- Commentaires : expliquer **pourquoi**, jamais **quoi**.
- Constantes de gameplay regroupées dans `src/game/config.ts`.
- Messages de commit en anglais, format conventionnel (`feat:`, `fix:`, `data:`, `chore:`).

---

## 13. Ordre d'implémentation

0. **Écrire à `communication@assemblee-nationale.fr`** (§6.3). Le reste peut avancer
   en parallèle, mais rien ne se publie avant la réponse.
1. Init Vite + TS + Vitest + ESLint + Prettier, CI verte.
2. `scripts/fetch-deputies.ts` + `data/deputies.schema.ts` + `photoUrl.ts` et son test.
   Vérifier que les 577 portraits s'affichent avant d'aller plus loin.
3. `groups.ts` avec l'invariant anti-collision **écrit avant** de remplir la table,
   puis `matching.ts`. Ce sont les briques délicates.
4. `deck.ts`, `scoring.ts`, `hints.ts` + tests.
5. `reducer.ts` + tests : la partie tourne sans interface.
6. Interface, puis écran de fin et meilleur score.
7. Page « Crédits » : source, Licence Ouverte, date de collecte.
8. `check-freshness.yml` et `check-photo-links.ts`.
9. **Puis seulement**, si l'autorisation est obtenue : déploiement.

Ne pas passer à l'étape suivante tant que la précédente n'est pas testée.

---

## 14. Licences

| Couche               | Régime                                          | Pourquoi                                                               |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Code source          | MIT (`LICENSE`)                                 | norme de l'écosystème                                                  |
| `data/deputies.json` | **Licence Ouverte / Etalab**, à mentionner      | dérivé de l'open data de l'Assemblée : la mention de la source est due |
| Portraits            | **© Assemblée nationale, tous droits réservés** | ni hébergés ni redistribués ici (§6.3)                                 |

La Licence Ouverte impose la **paternité** : citer « Assemblée nationale » et la date
de la version utilisée. C'est peu coûteux et c'est obligatoire.

Le projet est **non commercial et sans publicité**, et doit le rester : ce n'est pas
une préférence mais une condition posée par les mentions légales.

---

## 15. Idées pour plus tard (ne pas implémenter sans demande)

- Mode « commission » : ne tirer que les membres d'une commission permanente.
- Mode « département » : ne tirer que les élus d'une région.
- Mode inverse : on donne le nom, il faut retrouver le portrait parmi quatre.
- Mode chrono.

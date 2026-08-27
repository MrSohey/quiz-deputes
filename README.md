# Quiz des députés

Jeu web : un portrait de député en exercice s'affiche, il faut retrouver **son nom**
et **son groupe politique à l'Assemblée nationale**. Trois indices en cas de blocage.

**577 députés, trois niveaux gigognes** : Facile (130), Intermédiaire (300),
Difficile (les 577).

> ⚠️ **Usage local uniquement pour l'instant.** Le site n'est pas publié, et le
> workflow de déploiement est volontairement en déclenchement manuel. Voir
> [Photographies](#photographies) ci-dessous : la question de la licence n'est pas
> tranchée.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
```

Node 24 ou plus.

## Commandes

| Commande              | Effet                                                   |
| --------------------- | ------------------------------------------------------- |
| `npm run dev`         | serveur de développement                                |
| `npm run fetch`       | régénère `data/deputies.json` depuis l'open data        |
| `npm run validate`    | valide le fichier de données contre le schéma Zod       |
| `npm test`            | tests unitaires                                         |
| `npm run verify`      | format + lint + types + validation + tests, sans réseau |
| `npm run check-links` | vérifie que chaque portrait répond encore (avec réseau) |
| `npm run build`       | build de production                                     |

## Mettre à jour la composition

La base est **périssable**. Démissions, élections partielles et surtout changements
de groupe modifient la bonne réponse.

```bash
npm run fetch && npm run verify
```

Un workflow hebdomadaire compare l'open data à la base et **ouvre une issue** en cas
d'écart. Il ne commite rien tout seul : une mise à jour non relue serait un bug
invisible, là qu'une réponse fausse est un bug visible.

Deux fichiers survivent à la régénération, parce qu'ils vivent à part : les
`aliases` (`data/aliases.json`) et l'échelle de difficulté (`data/difficulty.json`).
Un député arrivé après le gel de l'échelle est rangé au niveau 3, et le script le
signale.

## Données et licences

### Données textuelles

Noms, circonscriptions et groupes viennent du fichier des députés en exercice publié
par l'Assemblée nationale en [open data](https://data.assemblee-nationale.fr/), sous
**Licence Ouverte / Etalab**. La licence impose de citer la source et sa version :
c'est fait sur la page « Crédits » du jeu, avec la date de collecte.

Deux pièges dans ce fichier, tous deux traités par le script de collecte : il est
encodé en **cp1252** et non en UTF-8, et son séparateur est le **point-virgule**.

### Photographies

**Les portraits ne sont ni téléchargés, ni stockés, ni redistribués.** Ils sont
affichés par lien depuis le serveur de l'Assemblée.

Les [mentions légales](https://www.assemblee-nationale.fr/dyn/info-site) sont
explicites : « Les graphismes, photographies et ressources multimédias ne peuvent
être reproduits sans accord préalable ». La même page autorise en revanche « tout
site Internet […] à mettre en place un lien hypertexte pointant vers son contenu ».

Le pari retenu est donc que **lier n'est pas reproduire**. Ce raisonnement n'est pas
certain : une balise `<img>` affiche l'image et non seulement y renvoie. D'où la
demande d'autorisation en cours auprès de `communication@assemblee-nationale.fr`, et
d'ici là un usage strictement local.

Le jeu est et doit rester **gratuit, sans publicité et non commercial** : c'est une
condition posée par les mentions légales, pas une préférence.

### Code

MIT.

## Contribuer une correction

`data/deputies.json` est **régénéré**, jamais édité à la main : une correction y
serait écrasée à la prochaine mise à jour. Selon la nature du problème :

- **une donnée fausse** (groupe, circonscription) vient de l'open data : elle se
  corrige en amont, auprès de l'Assemblée ;
- **un nom refusé alors qu'il est juste** se corrige en ajoutant un alias dans
  `data/aliases.json` ;
- **une appellation de groupe refusée** se corrige dans `src/game/groups.ts`. Les
  tests vérifient qu'aucune appellation ne devienne ambiguë : si `groups.test.ts`
  échoue après votre ajout, c'est que le nouvel alias résout vers deux groupes.

## L'échelle de difficulté est figée

`data/difficulty.json` porte le niveau de chaque député **et les deux signaux qui
l'ont produit** — médiane mensuelle des consultations Wikipédia, et nombre de versions
linguistiques. Elle a été établie une fois, le 25 août 2026, et **ne se recalcule
pas**.

La raison n'est pas la paresse : la notoriété dérive de mois en mois, et une
difficulté mouvante casserait la comparaison des scores et rendrait irreproductible
tout défi partagé. Le jeu a déjà une pièce mobile, la composition de l'Assemblée.

Soixante-neuf députés y entrent d'office, sans passer par la mesure : présidents de
groupe, anciens ministres, dirigeants de parti, et tous ceux qui totalisent quatre
mandats ou plus.

Deux réserves à connaître avant de défendre ce classement : il mesure l'attention
portée à un **nom**, pas la reconnaissance d'un **visage** ; et il reste inégal entre
groupes, le niveau Facile allant de 9 % du groupe RN à 41 % du groupe LFI. C'est
mécanique, mais cela se voit. Le détail est en §7.9 du `CLAUDE.md`.

## Deux points à connaître avant de toucher au code

**Le barème de tolérance aux fautes est plus sévère que dans quiz-ministres**, et
c'est mesuré : sur 561 noms de famille distincts, le barème d'origine confondait 14
paires de députés réels — Bannier et Barnier, Gaillard et Maillard. Un test
(`data.test.ts`) vérifie sur la base réelle qu'aucun nom n'en valide un autre.

**Les sigles se comparent en égalité stricte.** `DR`, `GDR` et `UDR` ne diffèrent que
d'une lettre : la moindre tolérance les rendrait interchangeables.

/**
 * Compare deux versions de `deputies.json` et en tire un résumé lisible.
 *
 * C'est ce qui rend relisable la pull request ouverte par le contrôle hebdomadaire
 * (CLAUDE.md §5.2) : un diff JSON de 200 ko ne dit pas qui est arrivé, qui est parti
 * et surtout qui a changé de groupe — or c'est ce dernier cas qui change la bonne
 * réponse du jeu, et il passe inaperçu dans un diff brut.
 *
 * Le résumé part sur la sortie standard, en Markdown, pour servir de corps de PR.
 * Le code de sortie, lui, ne signale pas une erreur mais l'absence de changement :
 * 0 s'il y a quelque chose à relire, 1 sinon.
 *
 * Usage : tsx scripts/diff-composition.ts <avant.json> <après.json>
 */
import { readFileSync } from "node:fs";
import { GROUP_BY_ID } from "../src/game/groups";
import type { DeputiesFile, Deputy } from "../src/game/types";

function lire(chemin: string): Map<string, Deputy> {
  const fichier = JSON.parse(readFileSync(chemin, "utf8")) as DeputiesFile;
  return new Map(fichier.deputies.map((d) => [d.id, d]));
}

function nom(d: Deputy): string {
  return `${d.firstName} ${d.lastName}`;
}

function sigle(d: Deputy): string {
  return GROUP_BY_ID.get(d.group)?.officialAbbreviation ?? d.group;
}

function circonscription(d: Deputy): string {
  return `${d.department}, ${d.constituency === 1 ? "1re" : `${d.constituency}e`}`;
}

const [avantChemin, apresChemin] = process.argv.slice(2);
if (!avantChemin || !apresChemin) {
  console.error("Usage : tsx scripts/diff-composition.ts <avant.json> <après.json>");
  process.exit(2);
}

const avant = lire(avantChemin);
const apres = lire(apresChemin);

const arrivees = [...apres.values()].filter((d) => !avant.has(d.id));
const departs = [...avant.values()].filter((d) => !apres.has(d.id));
const changementsDeGroupe: { avant: Deputy; apres: Deputy }[] = [];
const autresChangements: { avant: Deputy; apres: Deputy }[] = [];

for (const [id, suivant] of apres) {
  const precedent = avant.get(id);
  if (!precedent) continue;
  if (precedent.group !== suivant.group) {
    changementsDeGroupe.push({ avant: precedent, apres: suivant });
  } else if (JSON.stringify(precedent) !== JSON.stringify(suivant)) {
    autresChangements.push({ avant: precedent, apres: suivant });
  }
}

const total =
  arrivees.length +
  departs.length +
  changementsDeGroupe.length +
  autresChangements.length;

if (total === 0) {
  process.exit(1); // rien à relire
}

const lignes: string[] = [];
lignes.push(
  "La composition publiée par l'Assemblée ne correspond plus à `data/deputies.json`.",
  "Cette branche porte la régénération, à relire avant fusion.",
  "",
);

if (changementsDeGroupe.length > 0) {
  // En tête, parce que c'est le seul cas qui rend FAUSSE une réponse déjà correcte.
  lignes.push(`### Changements de groupe (${changementsDeGroupe.length})`, "");
  for (const { avant: a, apres: b } of changementsDeGroupe) {
    lignes.push(`- **${nom(b)}** — ${sigle(a)} → **${sigle(b)}**`);
  }
  lignes.push("");
}

if (arrivees.length > 0) {
  lignes.push(`### Arrivées (${arrivees.length})`, "");
  for (const d of arrivees) {
    lignes.push(`- **${nom(d)}** — ${sigle(d)}, ${circonscription(d)}`);
  }
  lignes.push("");
}

if (departs.length > 0) {
  lignes.push(`### Départs (${departs.length})`, "");
  for (const d of departs) {
    lignes.push(`- ${nom(d)} — ${sigle(d)}, ${circonscription(d)}`);
  }
  lignes.push("");
}

if (autresChangements.length > 0) {
  lignes.push(`### Autres modifications (${autresChangements.length})`, "");
  for (const { apres: d } of autresChangements) {
    lignes.push(`- ${nom(d)} — circonscription ou profession modifiée`);
  }
  lignes.push("");
}

// Un arrivant est absent de l'échelle figée et atterrit donc au niveau 3. C'est le
// comportement voulu — on n'invente pas de notoriété — mais c'est un arbitrage
// humain, pas un détail : autant le poser sous les yeux du relecteur.
const sansEchelle = arrivees.filter((d) => d.difficulty === 3);
if (sansEchelle.length > 0) {
  lignes.push(
    `### À arbitrer : ${sansEchelle.length} arrivant${sansEchelle.length > 1 ? "s" : ""} au niveau 3`,
    "",
    "Absents de l'échelle de difficulté figée (`data/difficulty.json`), ils sont",
    "rangés au niveau le plus difficile par défaut. Si l'un d'eux est une figure",
    "connue, ajoutez-le à l'échelle à la main — elle ne se recalcule pas (§7.9).",
    "",
  );
  for (const d of sansEchelle) lignes.push(`- ${nom(d)}`);
  lignes.push("");
}

lignes.push("---", "", "Régénéré par `npm run fetch`, validé par `npm run verify`.");

console.log(lignes.join("\n"));

/**
 * Échelle d'indices. Voir CLAUDE.md §7.5.
 *
 * Trois indices seulement, demandés explicitement par le joueur, du plus vague au
 * plus révélateur. Ils ne se déclenchent jamais tout seuls.
 *
 * Le deuxième n'existe pas pour tout le monde : un non-inscrit n'a pas de groupe
 * dont déduire une famille, et LIOT est trop hétérogène pour en porter une. Le
 * constructeur renvoie alors `null` et l'indice est escamoté — on n'affiche jamais
 * « famille : inconnue », qui coûterait 10 points pour zéro information.
 */
import { GROUP_BY_ID } from "./groups";
import type { Deputy, PoliticalFamily } from "./types";

const FAMILY_LABELS: Record<PoliticalFamily, string> = {
  gauche: "gauche",
  centre: "centre",
  droite: "droite",
  "extreme-droite": "extrême droite",
};

/** « 1re » et non « 1e » : c'est la forme utilisée par l'Assemblée. */
function ordinal(n: number): string {
  return n === 1 ? "1re" : `${n}e`;
}

/** Renvoie `null` quand l'indice n'a pas de contenu pour cette personne. */
type HintBuilder = (deputy: Deputy) => string | null;

const HINT_BUILDERS: readonly HintBuilder[] = [
  (d) => `Élu·e dans ${d.department}, ${ordinal(d.constituency)} circonscription.`,
  (d) => {
    const family = GROUP_BY_ID.get(d.group)?.family ?? null;
    return family === null ? null : `Famille politique : ${FAMILY_LABELS[family]}.`;
  },
  (d) => {
    const initials = `${d.firstName.charAt(0)}. ${d.lastName.charAt(0)}.`;
    const letters = d.lastName.replace(/[^\p{L}]/gu, "").length;
    return `${initials} — nom de famille en ${letters} lettres.`;
  },
];

/** Borne supérieure théorique, quand tous les indices sont disponibles. */
export const MAX_HINTS = HINT_BUILDERS.length;

/** Indices réellement disponibles pour cette personne, dans l'ordre. */
export function availableHints(deputy: Deputy): string[] {
  const hints: string[] = [];
  for (const build of HINT_BUILDERS) {
    const hint = build(deputy);
    if (hint !== null) hints.push(hint);
  }
  return hints;
}

/**
 * Nombre d'indices proposables. Varie d'une fiche à l'autre : c'est ce nombre qui
 * s'affiche dans le bouton « Indice (n/N) », pas la borne théorique.
 */
export function maxHintsFor(deputy: Deputy): number {
  return availableHints(deputy).length;
}

/** Les `count` premiers indices disponibles. */
export function hintsFor(deputy: Deputy, count: number): string[] {
  const available = availableHints(deputy);
  return available.slice(0, Math.max(0, Math.min(count, available.length)));
}

export function hasMoreHints(deputy: Deputy, count: number): boolean {
  return count < maxHintsFor(deputy);
}

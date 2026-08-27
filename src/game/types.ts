/**
 * Types du domaine. Voir CLAUDE.md §4.
 *
 * Règle structurante : une fiche = un député EN EXERCICE. Pas d'historique, pas de
 * mandat multiple. Un député siège dans un seul groupe à un instant donné, ce qui
 * rend la seconde réponse unique — contrairement à quiz-ministres, où plusieurs
 * ministères étaient acceptés.
 */

/** Identifiant de l'Assemblée nationale, repris tel quel. Ex. « 795998 ». */
export type DeputyId = string;

/**
 * Groupes de la XVIIe législature.
 *
 * `ni` n'est pas un groupe mais l'absence de groupe. On le traite quand même comme
 * une réponse valable : c'est ce que le joueur a à l'esprit devant un non-inscrit.
 */
export const GROUP_IDS = [
  "rn",
  "epr",
  "lfi-nfp",
  "soc",
  "dr",
  "ecos",
  "dem",
  "hor",
  "liot",
  "gdr",
  "udr",
  "ni",
] as const;

export type GroupId = (typeof GROUP_IDS)[number];

export const POLITICAL_FAMILIES = [
  "gauche",
  "centre",
  "droite",
  "extreme-droite",
] as const;

export type PoliticalFamily = (typeof POLITICAL_FAMILIES)[number];

/**
 * Difficulté d'une fiche, de 1 (facile) à 3 (difficile).
 *
 * Elle est FIGÉE dans `data/difficulty.json` et n'est pas recalculée : la notoriété
 * dérive, mais une difficulté mouvante casserait la comparaison des scores et les
 * défis partagés. Voir CLAUDE.md §7.9.
 */
export const DIFFICULTIES = [1, 2, 3] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export interface Deputy {
  id: DeputyId;
  firstName: string;
  lastName: string;
  /** Formes alternatives acceptées : nom d'usage, particule, orthographe courante. */
  aliases: string[];
  group: GroupId;
  /** Département ou collectivité, tel qu'écrit par l'Assemblée. Ex. « Ariège ». */
  department: string;
  /** Numéro de circonscription dans le département. */
  constituency: number;
  /** Profession déclarée. Sert à la page de crédits, jamais au jeu. */
  profession: string | null;
  difficulty: Difficulty;
  /** Fiche officielle, pour vérification humaine. Obligatoire. */
  sourceUrl: string;
}

/**
 * Le fichier porte une date de collecte : la composition de l'Assemblée bouge, et
 * un joueur qui trouve une réponse fausse doit pouvoir comprendre pourquoi (§5.2).
 */
export interface DeputiesFile {
  fetchedAt: string;
  deputies: Deputy[];
}

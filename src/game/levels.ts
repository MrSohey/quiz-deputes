/**
 * Niveaux de difficulté. Voir CLAUDE.md §7.9.
 *
 * Les trois viviers sont **gigognes** : monter de niveau, c'est retrouver les
 * députés déjà connus noyés dans un ensemble plus large. Un joueur ne perd donc
 * jamais ce qu'il a appris.
 *
 * L'échelle est figée dans `data/difficulty.json` et ne se recalcule pas : la
 * notoriété dérive, mais une difficulté mouvante casserait la comparaison des
 * scores et les défis partagés.
 */
import type { Deputy, Difficulty } from "./types";

export const LEVEL_IDS = ["facile", "intermediaire", "difficile"] as const;

export type LevelId = (typeof LEVEL_IDS)[number];

export interface Level {
  id: LevelId;
  label: string;
  /** Phrase affichée sous le bouton, pour que le choix soit éclairé. */
  description: string;
  /** Difficulté maximale admise. C'est ce qui rend les viviers gigognes. */
  maxDifficulty: Difficulty;
}

export const LEVELS: readonly Level[] = [
  {
    id: "facile",
    label: "Facile",
    description: "Les visages les plus vus : figures nationales, anciens ministres.",
    maxDifficulty: 1,
  },
  {
    id: "intermediaire",
    label: "Intermédiaire",
    description: "On y ajoute les députés connus sans être des figures de premier plan.",
    maxDifficulty: 2,
  },
  {
    id: "difficile",
    label: "Difficile",
    description: "Les 577, y compris ceux dont personne n'a jamais vu le visage.",
    maxDifficulty: 3,
  },
];

export const LEVEL_BY_ID: ReadonlyMap<LevelId, Level> = new Map(
  LEVELS.map((l) => [l.id, l]),
);

/** Une chaîne reçue par URL peut être n'importe quoi : on la borne avant usage. */
export function isLevelId(value: string): value is LevelId {
  return LEVEL_BY_ID.has(value as LevelId);
}

export function deputiesForLevel(
  deputies: readonly Deputy[],
  level: LevelId,
): readonly Deputy[] {
  const max = LEVEL_BY_ID.get(level)?.maxDifficulty ?? 3;
  return deputies.filter((d) => d.difficulty <= max);
}

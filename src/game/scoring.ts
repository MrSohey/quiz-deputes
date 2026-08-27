/** Calcul des points. Voir CLAUDE.md §7.7. */
import {
  PENALTY_PER_HINT,
  POINTS_FOR_GROUP,
  POINTS_FOR_NAME,
  STREAK_BONUS,
  STREAK_THRESHOLD,
} from "./config";

export interface RoundOutcome {
  nameFound: boolean;
  groupFound: boolean;
  hintsUsed: number;
}

/** Points bruts d'une manche, malus d'indices déduits, plancher à 0. */
export function scoreRound(outcome: RoundOutcome): number {
  const base =
    (outcome.nameFound ? POINTS_FOR_NAME : 0) +
    (outcome.groupFound ? POINTS_FOR_GROUP : 0);
  if (base === 0) return 0; // manche révélée sans réponse : pas de score négatif
  return Math.max(0, base - outcome.hintsUsed * PENALTY_PER_HINT);
}

/** Une manche compte pour la série si elle est pleinement résolue sans aucun indice. */
export function continuesStreak(outcome: RoundOutcome): boolean {
  return outcome.nameFound && outcome.groupFound && outcome.hintsUsed === 0;
}

/**
 * Bonus accordé pour la manche courante compte tenu de la série en cours.
 * `streakLength` est le nombre de manches parfaites consécutives, celle-ci incluse.
 */
export function streakBonus(streakLength: number): number {
  return streakLength > STREAK_THRESHOLD ? STREAK_BONUS : 0;
}

/**
 * Constantes de gameplay, regroupées ici pour régler le jeu sans fouiller le code.
 * Voir CLAUDE.md §7.7 et §12.
 */

/** Nombre de manches dans une partie, plafonné par la taille du vivier. */
export const ROUNDS_PER_GAME = 10;

export function roundsForPool(poolSize: number): number {
  return Math.max(1, Math.min(ROUNDS_PER_GAME, poolSize));
}

/** Points pour le nom trouvé. */
export const POINTS_FOR_NAME = 50;

/** Points pour le groupe trouvé. */
export const POINTS_FOR_GROUP = 50;

/** Retiré du total de la manche par indice demandé. Plancher à 0. */
export const PENALTY_PER_HINT = 10;

/** Manches consécutives sans indice au-delà desquelles le bonus de série démarre. */
export const STREAK_THRESHOLD = 2;

/** Bonus accordé par manche une fois le seuil de série franchi. */
export const STREAK_BONUS = 25;

/**
 * Clé du meilleur score, différenciée par niveau : les trois viviers n'ont pas la
 * même difficulté, un score unique n'aurait pas de sens.
 *
 * `localStorage`, pas de cookie. Donnée strictement fonctionnelle, first-party,
 * jamais transmise : aucune bannière de consentement n'est requise.
 */
export function bestScoreStorageKey(levelId: string): string {
  return `quiz-deputes:best-score:${levelId}`;
}

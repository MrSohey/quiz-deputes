/**
 * Ordre de passage d'une partie. Voir CLAUDE.md §7.3.
 *
 * Piocher au hasard à chaque manche ferait revenir la même personne deux fois dans
 * une partie (paradoxe des anniversaires). On mélange donc le vivier une fois pour
 * toutes, au démarrage, et on avance dans cet ordre.
 *
 * Ce mélange unique est aussi ce qui rend le défi partageable possible : l'ordre ne
 * dépend que de la graine, et non du moment où chaque action est jouée.
 */

/** Source d'aléa injectable, pour que les tests soient déterministes. */
export type Rng = () => number;

/** Mélange de Fisher-Yates, sans muter l'entrée. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

/**
 * Ordre de passage complet du vivier.
 *
 * On mélange TOUT le vivier, pas seulement les dix premières manches : le reste sert
 * de réserve quand un portrait se révèle indisponible et qu'il faut remplacer une
 * fiche sans casser la reproductibilité.
 */
export function createLineup<T>(pool: readonly T[], rng: Rng): T[] {
  if (pool.length === 0) throw new Error("Impossible de tirer dans un vivier vide");
  return shuffle(pool, rng);
}

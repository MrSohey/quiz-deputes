/**
 * Encodage du défi dans l'URL. Voir CLAUDE.md §7.6.
 *
 * Format : `?defi=<niveau>.<graine>.<empreinte>`. Le niveau en fait partie : sans
 * lui, un lien rejouerait le même tirage sur un autre vivier, donc une autre partie.
 *
 * Un lien vient d'un tiers et peut être tronqué par une messagerie ou bricolé à la
 * main : `decodeChallenge` renvoie `null` à la moindre anomalie, et le joueur
 * retombe sur une partie ordinaire.
 */
import { isLevelId, type LevelId } from "./levels";
import { isValidSeed } from "./seed";

export const CHALLENGE_PARAM = "defi";

export interface Challenge {
  level: LevelId;
  seed: string;
  fingerprint: string;
}

export function encodeChallenge(c: Challenge): string {
  return `${c.level}.${c.seed}.${c.fingerprint}`;
}

export function decodeChallenge(raw: string | null): Challenge | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [level, seed, fingerprint] = parts;
  if (!level || !seed || !fingerprint) return null;
  if (!isLevelId(level)) return null;
  if (!isValidSeed(seed)) return null;
  if (!/^[a-z0-9]{1,10}$/.test(fingerprint)) return null;
  return { level, seed, fingerprint };
}

/** Lit le défi de l'URL courante. Impur : réservé à l'interface. */
export function readChallengeFromLocation(search: string): Challenge | null {
  return decodeChallenge(new URLSearchParams(search).get(CHALLENGE_PARAM));
}

/** Construit l'URL partageable d'une partie. */
export function challengeUrl(origin: string, pathname: string, c: Challenge): string {
  return `${origin}${pathname}?${CHALLENGE_PARAM}=${encodeChallenge(c)}`;
}

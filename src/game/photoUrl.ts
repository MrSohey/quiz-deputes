/**
 * URL du portrait officiel. Voir CLAUDE.md §6.3.
 *
 * Les portraits ne sont NI téléchargés, NI stockés, NI redistribués : ils sont
 * chargés depuis le serveur de l'Assemblée nationale, qui interdit la reproduction
 * de ses photographies mais autorise expressément les liens vers son contenu.
 *
 * L'URL se déduit de l'identifiant : la stocker dans les données serait une
 * occasion de divergence, pour une valeur entièrement calculable.
 */
import type { DeputyId } from "./types";

/** À changer à la législature suivante, comme dans le script de collecte. */
const LEGISLATURE = "17";

const PHOTO_BASE = `https://www.assemblee-nationale.fr/dyn/static/tribun/${LEGISLATURE}/photos/carre/`;

/** Portrait carré officiel. Vérifié : 200, image/jpeg, ~50 Ko. */
export function photoUrl(id: DeputyId): string {
  return `${PHOTO_BASE}${encodeURIComponent(id)}.jpg`;
}

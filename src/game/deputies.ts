/**
 * Point d'entrée unique vers la base.
 *
 * Le JSON est importé tel quel (Vite l'inline dans le bundle) puis typé. La
 * validation Zod n'est pas faite ici mais au build (`npm run validate`) et dans les
 * tests : inutile de payer une validation à chaque chargement de page pour des
 * données figées au moment du build.
 */
import rawFile from "../../data/deputies.json";
import type { Deputy, DeputiesFile } from "./types";

const file = rawFile as DeputiesFile;

export const DEPUTIES: readonly Deputy[] = file.deputies;

/**
 * Date de collecte, affichée sur la page de crédits.
 *
 * La composition de l'Assemblée bouge : un joueur à qui le jeu refuse une bonne
 * réponse doit pouvoir comprendre que les données ont vieilli (CLAUDE.md §5.2).
 */
export const FETCHED_AT = file.fetchedAt;

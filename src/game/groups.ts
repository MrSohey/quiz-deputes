/**
 * Table des appellations acceptées pour chaque groupe. Voir CLAUDE.md §7.4.
 *
 * Elle vit dans le code et non dans `deputies.json` : elle décrit un groupe, pas une
 * personne, et `deputies.json` est régénéré à chaque mise à jour de la composition.
 *
 * Deux règles à ne pas perdre de vue en l'étendant :
 *  - les SIGLES sont séparés des alias, car ils sont comparés en égalité stricte.
 *    Ici plus qu'ailleurs : `DR`, `GDR` et `UDR` ne diffèrent que d'une lettre, et
 *    `RN` et `NI` tiennent sur deux caractères ;
 *  - `groups.test.ts` vérifie qu'aucune appellation ne résout vers deux groupes.
 *    Ajouter un alias ambigu fait échouer les tests.
 */
import { GROUP_IDS, type GroupId, type PoliticalFamily } from "./types";

export interface Group {
  id: GroupId;
  /** Intitulé officiel, affiché à la révélation. */
  officialLabel: string;
  /** Sigle officiel de l'Assemblée, affiché à côté de l'intitulé. */
  officialAbbreviation: string;
  /** Formes courantes, usuelles, journalistiques. Tolérantes aux fautes. */
  aliases: string[];
  /** Sigles. Correspondance EXACTE uniquement. */
  acronyms: string[];
  /**
   * Famille politique, servant d'indice n°2.
   *
   * C'est un JUGEMENT, pas une donnée de l'Assemblée : il est donc ici, en clair,
   * relisable et contestable, et jamais dans les données. `null` escamote l'indice
   * (§7.5) — en cas de doute réel, c'est la bonne réponse.
   */
  family: PoliticalFamily | null;
}

export const GROUPS: readonly Group[] = [
  {
    id: "rn",
    officialLabel: "Rassemblement National",
    officialAbbreviation: "RN",
    aliases: ["rassemblement national", "front national", "lepénistes", "frontistes"],
    acronyms: ["rn", "fn"],
    family: "extreme-droite",
  },
  {
    id: "epr",
    officialLabel: "Ensemble pour la République",
    officialAbbreviation: "EPR",
    aliases: [
      "ensemble pour la république",
      "renaissance",
      "macronistes",
      "ensemble",
      "majorité présidentielle",
    ],
    acronyms: ["epr"],
    family: "centre",
  },
  {
    id: "lfi-nfp",
    officialLabel: "La France insoumise – Nouveau Front Populaire",
    officialAbbreviation: "LFI-NFP",
    aliases: [
      "la france insoumise nouveau front populaire",
      "la france insoumise",
      "france insoumise",
      "insoumis",
      "insoumise",
      "nouveau front populaire",
      "mélenchonistes",
    ],
    acronyms: ["lfi", "nfp"],
    family: "gauche",
  },
  {
    id: "soc",
    officialLabel: "Socialistes et apparentés",
    officialAbbreviation: "SOC",
    aliases: ["socialistes et apparentés", "socialistes", "parti socialiste"],
    acronyms: ["soc", "ps"],
    family: "gauche",
  },
  {
    id: "dr",
    officialLabel: "Droite Républicaine",
    officialAbbreviation: "DR",
    aliases: ["droite républicaine", "les républicains", "républicains"],
    acronyms: ["dr", "lr"],
    family: "droite",
  },
  {
    id: "ecos",
    officialLabel: "Écologiste et Social",
    officialAbbreviation: "EcoS",
    aliases: ["écologiste et social", "écologistes", "les écologistes", "verts"],
    acronyms: ["ecos"],
    family: "gauche",
  },
  {
    id: "dem",
    officialLabel: "Les Démocrates",
    officialAbbreviation: "Dem",
    aliases: ["les démocrates", "démocrates", "mouvement démocrate"],
    acronyms: ["dem", "modem"],
    family: "centre",
  },
  {
    id: "hor",
    officialLabel: "Horizons & Indépendants",
    officialAbbreviation: "HOR",
    aliases: ["horizons et indépendants", "horizons"],
    acronyms: ["hor"],
    family: "centre",
  },
  {
    id: "liot",
    officialLabel: "Libertés, Indépendants, Outre-mer et Territoires",
    officialAbbreviation: "LIOT",
    aliases: ["libertés indépendants outre-mer et territoires", "libertés"],
    acronyms: ["liot"],
    // Groupe hétérogène par construction : il rassemble des élus de sensibilités
    // différentes, et lui attribuer une famille unique serait un contresens. On
    // préfère perdre un indice que d'étiqueter à tort (CLAUDE.md §7.5).
    family: null,
  },
  {
    id: "gdr",
    officialLabel: "Gauche Démocrate et Républicaine",
    officialAbbreviation: "GDR",
    aliases: ["gauche démocrate et républicaine", "communistes", "parti communiste"],
    acronyms: ["gdr", "pcf"],
    family: "gauche",
  },
  {
    id: "udr",
    officialLabel: "Union des droites pour la République",
    officialAbbreviation: "UDR",
    aliases: ["union des droites pour la république", "union des droites", "ciottistes"],
    acronyms: ["udr"],
    // Retenu : le positionnement revendiqué par le groupe lui-même, « union des
    // droites ». Les commentateurs le classent diversement ; on s'en tient au nom
    // que ses membres ont choisi plutôt qu'à une appréciation extérieure.
    family: "droite",
  },
  {
    id: "ni",
    officialLabel: "Non inscrit",
    officialAbbreviation: "NI",
    aliases: ["non inscrit", "non inscrits", "sans groupe", "aucun groupe"],
    acronyms: ["ni"],
    // Absence de groupe : il n'y a pas de famille à en déduire, et en inventer une
    // pour quelqu'un qui a précisément choisi de n'en porter aucune serait une faute.
    family: null,
  },
];

/** Accès direct par id, construit une fois au chargement du module. */
export const GROUP_BY_ID: ReadonlyMap<GroupId, Group> = new Map(
  GROUPS.map((g) => [g.id, g]),
);

// Garde-fou : un groupe déclaré dans les types mais absent de la table donnerait
// une réponse impossible à deviner. On préfère échouer au chargement.
for (const id of GROUP_IDS) {
  if (!GROUP_BY_ID.has(id)) {
    throw new Error(`Groupe "${id}" absent de GROUPS`);
  }
}

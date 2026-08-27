/**
 * Construit `data/deputies.json` depuis l'open data de l'Assemblée nationale.
 *
 * Source unique : le fichier CSV des députés en exercice, publié sous Licence
 * Ouverte / Etalab (CLAUDE.md §6.2). Wikipédia n'est pas nécessaire.
 *
 * Le script est IDEMPOTENT et se rejoue en une commande : la composition de
 * l'Assemblée bouge sans arrêt, et c'est la seule façon de rester à jour (§5.2).
 *
 * Usage : npm run fetch
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { GROUP_IDS, type Deputy, type Difficulty, type GroupId } from "../src/game/types";

/** À changer à la législature suivante — d'où la constante nommée. */
const LEGISLATURE = "17";

const CSV_URL =
  `https://data.assemblee-nationale.fr/static/openData/repository/${LEGISLATURE}` +
  "/amo/deputes_actifs_csv_opendata/liste_deputes_excel.csv";

const USER_AGENT =
  "quiz-deputes/0.1 (https://github.com/MrSohey/quiz-deputes; collecte open data)";

/** Sigle publié par l'Assemblée → identifiant interne. */
const GROUP_BY_ABBREVIATION: Record<string, GroupId> = {
  RN: "rn",
  EPR: "epr",
  "LFI-NFP": "lfi-nfp",
  SOC: "soc",
  DR: "dr",
  EcoS: "ecos",
  Dem: "dem",
  HOR: "hor",
  LIOT: "liot",
  GDR: "gdr",
  UDR: "udr",
  NI: "ni",
};

/**
 * Découpe une ligne CSV en respectant les guillemets.
 *
 * Le fichier de l'Assemblée en met autour de chaque champ, et certaines professions
 * contiennent un point-virgule. Un `split(";")` naïf décalerait toutes les colonnes
 * de ces lignes-là, sans rien signaler.
 */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      // Deux guillemets consécutifs à l'intérieur d'un champ = un guillemet littéral.
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

async function main(): Promise<void> {
  const response = await fetch(CSV_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`Téléchargement impossible : HTTP ${response.status}`);
  }

  // Le fichier est encodé en cp1252, PAS en UTF-8 : le lire en UTF-8 échoue dès
  // le premier prénom accentué (« Émeline »).
  const raw = new TextDecoder("windows-1252").decode(await response.arrayBuffer());

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = splitCsvLine(lines[0] ?? "");
  const columnOf = (name: string): number => {
    const index = header.indexOf(name);
    if (index === -1) {
      throw new Error(
        `Colonne « ${name} » absente. En-tête reçu : ${header.join(" | ")}`,
      );
    }
    return index;
  };

  const columns = {
    id: columnOf("identifiant"),
    firstName: columnOf("Prénom"),
    lastName: columnOf("Nom"),
    department: columnOf("Département"),
    constituency: columnOf("Numéro de circonscription"),
    profession: columnOf("Profession"),
    group: columnOf("Groupe politique (abrégé)"),
  };

  // Les alias vivent à part : ce sont les seules données saisies à la main, et
  // elles doivent survivre à une régénération du fichier (§4.3).
  const aliasesPath = new URL("../data/aliases.json", import.meta.url);
  const aliases: Record<string, string[]> = existsSync(aliasesPath)
    ? (JSON.parse(readFileSync(aliasesPath, "utf8")) as Record<string, string[]>)
    : {};

  // La difficulté est figée et vit à part, comme les alias : elle doit survivre à
  // une régénération. Voir CLAUDE.md §7.9 — elle ne se recalcule pas.
  const difficultyPath = new URL("../data/difficulty.json", import.meta.url);
  const difficulties = (
    JSON.parse(readFileSync(difficultyPath, "utf8")) as {
      deputies: Record<string, { level: Difficulty }>;
    }
  ).deputies;

  const deputies: Deputy[] = [];
  const sansDifficulte: string[] = [];
  for (const line of lines.slice(1)) {
    const f = splitCsvLine(line);
    const abbreviation = f[columns.group] ?? "";
    const group = GROUP_BY_ABBREVIATION[abbreviation];
    if (!group) {
      throw new Error(
        `Groupe inconnu : « ${abbreviation} ». La composition de l'Assemblée a ` +
          "changé : compléter GROUP_BY_ABBREVIATION et src/game/groups.ts.",
      );
    }
    const id = f[columns.id] ?? "";
    const profession = f[columns.profession] ?? "";
    const difficulty = difficulties[id]?.level;
    if (!difficulty) {
      // Un député arrivé après le gel de l'échelle : on le range au niveau le plus
      // difficile plutôt que de lui inventer une notoriété.
      sansDifficulte.push(`${f[columns.firstName]} ${f[columns.lastName]}`);
    }
    deputies.push({
      id,
      firstName: f[columns.firstName] ?? "",
      lastName: f[columns.lastName] ?? "",
      aliases: aliases[id] ?? [],
      group,
      department: f[columns.department] ?? "",
      constituency: Number(f[columns.constituency] ?? "0"),
      profession: profession.length > 0 ? profession : null,
      difficulty: difficulty ?? 3,
      sourceUrl: `https://www.assemblee-nationale.fr/dyn/deputes/PA${id}`,
    });
  }

  deputies.sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "fr"),
  );

  const file = { fetchedAt: new Date().toISOString(), deputies };
  writeFileSync(
    new URL("../data/deputies.json", import.meta.url),
    `${JSON.stringify(file, null, 2)}\n`,
    "utf8",
  );

  if (sansDifficulte.length > 0) {
    console.warn(
      `⚠️  ${sansDifficulte.length} députés absents de l'échelle figée, rangés en ` +
        `niveau 3 : ${sansDifficulte.join(", ")}`,
    );
  }

  const counts = new Map<GroupId, number>();
  for (const d of deputies) counts.set(d.group, (counts.get(d.group) ?? 0) + 1);
  console.log(`✅ ${deputies.length} députés écrits dans data/deputies.json`);
  for (const id of GROUP_IDS) {
    console.log(`   ${id.padEnd(8)} ${counts.get(id) ?? 0}`);
  }
}

await main();

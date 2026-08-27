/**
 * Vérifie que chaque portrait répond encore. Voir CLAUDE.md §6.3.
 *
 * Les portraits sont servis par l'Assemblée nationale : on est invité chez
 * quelqu'un. D'où un `User-Agent` descriptif, des requêtes espacées, et une
 * distinction entre panne passagère et lien réellement mort.
 *
 * Volontairement NON bloquant en CI : un incident réseau ne doit pas empêcher un
 * merge par ailleurs valide.
 *
 * Usage : npm run check-links
 */
import { readFileSync } from "node:fs";
import { photoUrl } from "../src/game/photoUrl";
import type { DeputiesFile } from "../src/game/types";

const USER_AGENT =
  "quiz-deputes/0.1 (https://github.com/MrSohey/quiz-deputes; controle de liens)";

/** Pause entre deux requêtes : on ne martèle pas un serveur public. */
const DELAY_MS = 120;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const file = JSON.parse(
  readFileSync(new URL("../data/deputies.json", import.meta.url), "utf8"),
) as DeputiesFile;

const dead: string[] = [];
const transient: string[] = [];

for (const [index, deputy] of file.deputies.entries()) {
  const url = photoUrl(deputy.id);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
    });
    if (response.status === 404 || response.status === 410) {
      dead.push(`${deputy.lastName} ${deputy.firstName} — ${response.status} — ${url}`);
    } else if (!response.ok) {
      // 429, 500, 503 : le serveur est fatigué, pas le lien mort.
      transient.push(`${deputy.lastName} — HTTP ${response.status}`);
    }
  } catch (error) {
    transient.push(`${deputy.lastName} — ${String(error)}`);
  }
  if (index % 50 === 49) console.log(`   ${index + 1}/${file.deputies.length}…`);
  await sleep(DELAY_MS);
}

console.log(`\n${file.deputies.length} portraits contrôlés`);
if (transient.length > 0) {
  console.log(`\n⚠️  ${transient.length} réponses transitoires (à réessayer) :`);
  for (const t of transient.slice(0, 10)) console.log(`   ${t}`);
}
if (dead.length > 0) {
  console.error(`\n❌ ${dead.length} portraits introuvables :`);
  for (const d of dead) console.error(`   ${d}`);
  process.exit(1);
}
console.log("✅ tous les portraits répondent");

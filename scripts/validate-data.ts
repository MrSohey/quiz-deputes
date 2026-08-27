/**
 * Valide `data/deputies.json` contre le schéma Zod. Fait échouer le build en cas
 * d'anomalie, et tourne aussi en CI. Voir CLAUDE.md §4.3.
 *
 * Sans accès réseau : la disponibilité réelle des portraits est vérifiée à part par
 * `npm run check-links`, pour que ce contrôle reste rapide et exécutable hors ligne.
 */
import { readFileSync } from "node:fs";
import { deputiesFileSchema } from "../data/deputies.schema";
import { GROUP_IDS } from "../src/game/types";

const path = new URL("../data/deputies.json", import.meta.url);
const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
const result = deputiesFileSchema.safeParse(parsed);

if (!result.success) {
  console.error("❌ data/deputies.json invalide :\n");
  for (const issue of result.error.issues.slice(0, 20)) {
    console.error(`   ${issue.path.join(".")} — ${issue.message}`);
  }
  process.exit(1);
}

const { deputies, fetchedAt } = result.data;
const counts = new Map<string, number>();
for (const d of deputies) counts.set(d.group, (counts.get(d.group) ?? 0) + 1);

console.log(`✅ ${deputies.length} députés valides`);
console.log(`   collecte du ${new Date(fetchedAt).toLocaleDateString("fr-FR")}`);
console.log("   " + GROUP_IDS.map((id) => `${id} : ${counts.get(id) ?? 0}`).join(" · "));

// L'Assemblée compte 577 sièges. Un écart n'est pas forcément une erreur — il y a
// des sièges vacants entre une démission et l'élection partielle — mais il mérite
// d'être signalé plutôt que de passer inaperçu.
if (deputies.length !== 577) {
  console.warn(`⚠️  ${deputies.length} fiches au lieu de 577 : sièges vacants ?`);
}

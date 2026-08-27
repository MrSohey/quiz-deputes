/**
 * Validation de la base. Voir CLAUDE.md §9.
 *
 * Volontairement SANS accès réseau : la disponibilité réelle des portraits est
 * vérifiée par `npm run check-links`, pour que cette suite reste rapide et
 * exécutable hors ligne.
 */
import { describe, expect, it } from "vitest";
import { deputiesFileSchema } from "../../data/deputies.schema";
import { DEPUTIES, FETCHED_AT } from "./deputies";
import { GROUP_BY_ID } from "./groups";
import { isNameCorrect, normalize, reservedNames } from "./matching";
import { maxHintsFor } from "./hints";

describe("deputies.json", () => {
  it("respecte le schéma", () => {
    const result = deputiesFileSchema.safeParse({
      fetchedAt: FETCHED_AT,
      deputies: DEPUTIES,
    });
    expect(result.success).toBe(true);
  });

  it("a des identifiants uniques", () => {
    const ids = DEPUTIES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("compte les 577 sièges", () => {
    expect(DEPUTIES).toHaveLength(577);
  });

  it("rattache chaque député à un groupe connu", () => {
    for (const deputy of DEPUTIES) {
      expect(GROUP_BY_ID.has(deputy.group), `${deputy.lastName}`).toBe(true);
    }
  });

  it("renseigne département et circonscription, qui forment le premier indice", () => {
    for (const deputy of DEPUTIES) {
      expect(deputy.department.trim().length, `${deputy.lastName}`).toBeGreaterThan(0);
      expect(deputy.constituency, `${deputy.lastName}`).toBeGreaterThanOrEqual(1);
    }
  });

  // Deux indices est le minimum : en dessous, une manche deviendrait indevinable.
  it("propose au moins deux indices pour chaque fiche", () => {
    for (const deputy of DEPUTIES) {
      expect(maxHintsFor(deputy), `${deputy.lastName}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("pointe sur une fiche officielle par député", () => {
    for (const deputy of DEPUTIES) {
      expect(deputy.sourceUrl).toBe(
        `https://www.assemblee-nationale.fr/dyn/deputes/PA${deputy.id}`,
      );
    }
  });
});

/**
 * L'invariant le plus important de ce projet.
 *
 * Sur 577 personnes, les noms se ressemblent : la tolérance aux fautes de frappe
 * peut créditer un député pour un autre. Ce test mesure le phénomène sur la base
 * RÉELLE et échoue si une seule paire se confond — c'est ainsi qu'ont été trouvées
 * Bannier/Barnier, Gaillard/Maillard et Gérard/Girard.
 */
describe("aucun nom ne se valide pour un autre député", () => {
  it("ne confond jamais deux fiches distinctes", () => {
    const reserved = reservedNames(DEPUTIES);
    const collisions: string[] = [];

    // Un nom de famille réellement partagé — il y en a quinze, dont trois Bonnet —
    // n'est pas une collision : le joueur a bien reconnu le nom.
    const homonyms = new Map<string, number>();
    for (const d of DEPUTIES) {
      const key = normalize(d.lastName);
      homonyms.set(key, (homonyms.get(key) ?? 0) + 1);
    }

    for (const answer of DEPUTIES) {
      for (const target of DEPUTIES) {
        if (answer.id === target.id) continue;
        if (normalize(answer.lastName) === normalize(target.lastName)) continue;
        if (isNameCorrect(answer.lastName, target, reserved)) {
          collisions.push(`« ${answer.lastName} » validerait ${target.lastName}`);
        }
      }
    }
    expect(collisions).toEqual([]);
  });
});

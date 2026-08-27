import { describe, expect, it } from "vitest";
import { DEPUTIES } from "./deputies";
import { LEVELS, LEVEL_IDS, deputiesForLevel, isLevelId } from "./levels";

describe("niveaux", () => {
  it("couvre les trois identifiants", () => {
    expect(LEVELS.map((l) => l.id)).toEqual([...LEVEL_IDS]);
  });

  it("borne une valeur reçue par URL", () => {
    expect(isLevelId("facile")).toBe(true);
    expect(isLevelId("FACILE")).toBe(false);
    expect(isLevelId("expert")).toBe(false);
    expect(isLevelId("")).toBe(false);
  });
});

/**
 * L'invariant qui empêche la fonctionnalité de devenir creuse : sur la base réelle,
 * chaque vivier doit être strictement plus large que le précédent, et contenir de
 * quoi jouer une partie entière.
 */
describe("viviers, sur la base réelle", () => {
  const tailles = LEVEL_IDS.map((id) => deputiesForLevel(DEPUTIES, id).length);

  it("croissent strictement", () => {
    expect(tailles[0]).toBeLessThan(tailles[1] as number);
    expect(tailles[1]).toBeLessThan(tailles[2] as number);
  });

  it("contiennent assez de monde pour une partie complète", () => {
    for (const taille of tailles) expect(taille).toBeGreaterThanOrEqual(10);
  });

  it("sont gigognes : chacun contient le précédent", () => {
    const facile = new Set(deputiesForLevel(DEPUTIES, "facile").map((d) => d.id));
    const inter = new Set(deputiesForLevel(DEPUTIES, "intermediaire").map((d) => d.id));
    const dur = new Set(deputiesForLevel(DEPUTIES, "difficile").map((d) => d.id));
    for (const id of facile) expect(inter.has(id)).toBe(true);
    for (const id of inter) expect(dur.has(id)).toBe(true);
  });

  it("couvre les 577 au niveau le plus dur", () => {
    expect(tailles[2]).toBe(DEPUTIES.length);
  });
});

import { describe, expect, it } from "vitest";
import { createLineup, shuffle } from "./deck";
import { createSeededRng } from "./seed";

const ITEMS = Array.from({ length: 20 }, (_, i) => `p${i}`);

describe("shuffle", () => {
  it("conserve exactement les mêmes éléments", () => {
    const out = shuffle(ITEMS, createSeededRng("graine"));
    expect(out.sort()).toEqual([...ITEMS].sort());
  });

  it("ne mute pas l'entrée", () => {
    const copie = [...ITEMS];
    shuffle(ITEMS, createSeededRng("graine"));
    expect(ITEMS).toEqual(copie);
  });
});

describe("createLineup", () => {
  // La propriété qui rend un défi partageable : même graine, même partie.
  it("est déterministe à graine égale", () => {
    const a = createLineup(ITEMS, createSeededRng("abc123"));
    const b = createLineup(ITEMS, createSeededRng("abc123"));
    expect(a).toEqual(b);
  });

  it("diffère d'une graine à l'autre", () => {
    const a = createLineup(ITEMS, createSeededRng("abc123"));
    const b = createLineup(ITEMS, createSeededRng("zzz999"));
    expect(a).not.toEqual(b);
  });

  // Le mélange couvre TOUT le vivier : le surplus sert de réserve quand un portrait
  // est indisponible et qu'il faut remplacer une fiche sans casser la graine.
  it("couvre tout le vivier, pas seulement les manches prévues", () => {
    expect(createLineup(ITEMS, createSeededRng("g")).length).toBe(ITEMS.length);
  });

  it("refuse un vivier vide plutôt que de renvoyer une partie vide", () => {
    expect(() => createLineup([], createSeededRng("g"))).toThrow();
  });
});

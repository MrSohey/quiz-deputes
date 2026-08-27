import { describe, expect, it } from "vitest";
import { availableHints, hasMoreHints, hintsFor, MAX_HINTS, maxHintsFor } from "./hints";
import type { Deputy, GroupId } from "./types";

function deputy(group: GroupId): Deputy {
  return {
    id: "1",
    firstName: "Audrey",
    lastName: "Abadie-Amiel",
    aliases: [],
    group,
    department: "Ariège",
    constituency: 2,
    profession: null,
    difficulty: 1,
    sourceUrl: "https://www.assemblee-nationale.fr/dyn/deputes/PA1",
  };
}

describe("échelle d'indices", () => {
  it("en propose trois, dans l'ordre annoncé", () => {
    const hints = availableHints(deputy("soc"));
    expect(hints).toHaveLength(MAX_HINTS);
    expect(hints[0]).toContain("Ariège");
    expect(hints[0]).toContain("2e circonscription");
    expect(hints[1]).toContain("gauche");
    expect(hints[2]).toContain("A. A.");
  });

  it("écrit « 1re » et non « 1e »", () => {
    const d = { ...deputy("soc"), constituency: 1 };
    expect(availableHints(d)[0]).toContain("1re circonscription");
  });

  // Un non-inscrit n'a pas de groupe dont déduire une famille, et LIOT est trop
  // hétérogène pour en porter une : l'indice est escamoté, pas affiché « inconnu ».
  it("escamote la famille politique quand le groupe n'en a pas", () => {
    expect(maxHintsFor(deputy("ni"))).toBe(2);
    expect(maxHintsFor(deputy("liot"))).toBe(2);
    expect(availableHints(deputy("ni")).some((h) => h.includes("Famille"))).toBe(false);
  });

  it("compte les indices restants d'après la fiche, pas d'après la borne", () => {
    expect(hasMoreHints(deputy("ni"), 2)).toBe(false);
    expect(hasMoreHints(deputy("soc"), 2)).toBe(true);
  });

  it("ne révèle jamais le groupe, qui est la réponse attendue", () => {
    for (const group of ["soc", "rn", "epr", "ni"] as const) {
      const texte = availableHints(deputy(group)).join(" ").toLowerCase();
      expect(texte).not.toContain("socialistes");
      expect(texte).not.toContain("rassemblement");
      expect(texte).not.toContain("ensemble");
    }
  });

  it("borne le nombre d'indices demandés", () => {
    expect(hintsFor(deputy("soc"), 99)).toHaveLength(MAX_HINTS);
    expect(hintsFor(deputy("soc"), -1)).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { GROUPS, GROUP_BY_ID } from "./groups";
import { isDiscriminatingWord, isGroupCorrect, resolveGroup } from "./matching";
import { GROUP_IDS } from "./types";
import type { Deputy } from "./types";

function deputy(group: Deputy["group"]): Deputy {
  return {
    id: "1",
    firstName: "Camille",
    lastName: "Durand",
    aliases: [],
    group,
    department: "Ariège",
    constituency: 2,
    profession: null,
    difficulty: 1,
    sourceUrl: "https://www.assemblee-nationale.fr/dyn/deputes/PA1",
  };
}

describe("resolveGroup — cas de référence", () => {
  // Personne ne cite l'intitulé officiel : c'est toute la difficulté de ce champ.
  for (const input of [
    "Ensemble pour la République",
    "ensemble pour la republique",
    "renaissance",
    "macronistes",
    "EPR",
    "epr",
  ]) {
    it(`accepte « ${input} » pour EPR`, () => {
      expect(resolveGroup(input)).toEqual(["epr"]);
    });
  }

  it("accepte les formes courantes des autres groupes", () => {
    expect(resolveGroup("insoumis")).toEqual(["lfi-nfp"]);
    expect(resolveGroup("socialistes")).toEqual(["soc"]);
    expect(resolveGroup("les républicains")).toEqual(["dr"]);
    expect(resolveGroup("modem")).toEqual(["dem"]);
    expect(resolveGroup("communistes")).toEqual(["gdr"]);
    expect(resolveGroup("sans groupe")).toEqual(["ni"]);
  });

  it("tolère les fautes sur les intitulés longs", () => {
    expect(resolveGroup("rassemblement nationnal")).toEqual(["rn"]);
    expect(resolveGroup("socialiste")).toEqual(["soc"]);
  });
});

describe("resolveGroup — sigles", () => {
  // Le piège central de ce jeu : DR, GDR et UDR ne diffèrent que d'une lettre, et
  // RN comme NI tiennent sur deux caractères. Une tolérance de 1 les confondrait.
  it("n'applique aucune tolérance aux sigles", () => {
    expect(resolveGroup("dr")).toEqual(["dr"]);
    expect(resolveGroup("gdr")).toEqual(["gdr"]);
    expect(resolveGroup("udr")).toEqual(["udr"]);
    expect(resolveGroup("rn")).toEqual(["rn"]);
    expect(resolveGroup("ni")).toEqual(["ni"]);
  });

  it("rejette un sigle inconnu au lieu de deviner le plus proche", () => {
    expect(resolveGroup("gdrr")).toEqual([]);
    expect(resolveGroup("nr")).toEqual([]);
    expect(resolveGroup("xyz")).toEqual([]);
  });

  // « verts » et « ecos » font cinq lettres sans espace : sans l'étape d'égalité
  // placée avant le rejet des sigles inconnus, ils ne résoudraient vers rien.
  it("ne prend pas un mot court réel pour un sigle", () => {
    expect(resolveGroup("verts")).toEqual(["ecos"]);
    expect(resolveGroup("ecos")).toEqual(["ecos"]);
    expect(resolveGroup("liot")).toEqual(["liot"]);
  });
});

describe("resolveGroup — mots non discriminants", () => {
  it("rejette un mot présent chez plusieurs groupes", () => {
    // « indépendants » est chez Horizons ET chez LIOT.
    expect(isDiscriminatingWord("indépendants")).toBe(false);
    expect(resolveGroup("indépendants")).toEqual([]);
  });

  it("reconnaît un mot propre à un seul groupe", () => {
    expect(isDiscriminatingWord("insoumise")).toBe(true);
    expect(isDiscriminatingWord("communistes")).toBe(true);
  });

  it("rejette une saisie faite uniquement de mots vides", () => {
    expect(resolveGroup("groupe")).toEqual([]);
    expect(resolveGroup("le groupe des")).toEqual([]);
    expect(resolveGroup("")).toEqual([]);
  });
});

/**
 * L'invariant qui protège la table sur la durée : ajouter une appellation ambiguë
 * fait échouer ce test, sans qu'on ait à y penser.
 */
describe("invariant anti-collision sur toute la table", () => {
  for (const group of GROUPS) {
    for (const label of [group.officialLabel, ...group.aliases, ...group.acronyms]) {
      it(`« ${label} » ne résout que vers ${group.id}`, () => {
        expect(resolveGroup(label)).toEqual([group.id]);
      });
    }
  }
});

describe("table des groupes", () => {
  it("couvre tous les identifiants du type", () => {
    expect(GROUPS.map((g) => g.id).sort()).toEqual([...GROUP_IDS].sort());
  });

  it("donne un intitulé et un sigle à chaque groupe", () => {
    for (const group of GROUPS) {
      expect(group.officialLabel.length).toBeGreaterThan(2);
      expect(group.officialAbbreviation.length).toBeGreaterThan(1);
    }
  });

  // Les deux seuls groupes sans famille, et pour des raisons documentées : LIOT est
  // hétérogène, les non-inscrits n'ont pas de groupe dont déduire quoi que ce soit.
  it("n'attribue pas de famille à LIOT ni aux non-inscrits", () => {
    expect(GROUP_BY_ID.get("liot")?.family).toBeNull();
    expect(GROUP_BY_ID.get("ni")?.family).toBeNull();
    const sansFamille = GROUPS.filter((g) => g.family === null).map((g) => g.id);
    expect(sansFamille.sort()).toEqual(["liot", "ni"]);
  });
});

describe("isGroupCorrect", () => {
  it("accepte le groupe du député, sous toutes ses formes", () => {
    expect(isGroupCorrect("rn", deputy("rn"))).toBe(true);
    expect(isGroupCorrect("Rassemblement National", deputy("rn"))).toBe(true);
    expect(isGroupCorrect("lepénistes", deputy("rn"))).toBe(true);
  });

  it("refuse un autre groupe", () => {
    expect(isGroupCorrect("socialistes", deputy("rn"))).toBe(false);
    expect(isGroupCorrect("gdr", deputy("dr"))).toBe(false);
    expect(isGroupCorrect("udr", deputy("dr"))).toBe(false);
  });
});

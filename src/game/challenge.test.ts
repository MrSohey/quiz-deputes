import { describe, expect, it } from "vitest";
import { challengeUrl, decodeChallenge, encodeChallenge } from "./challenge";

const DEFI = { level: "facile", seed: "uuhy9b", fingerprint: "13q47wh" } as const;

describe("encodeChallenge", () => {
  it("assemble niveau, graine et empreinte", () => {
    expect(encodeChallenge(DEFI)).toBe("facile.uuhy9b.13q47wh");
  });

  it("fait un aller-retour sans perte", () => {
    expect(decodeChallenge(encodeChallenge(DEFI))).toEqual(DEFI);
  });

  it("construit une URL partageable", () => {
    expect(challengeUrl("https://exemple.fr", "/quiz/", DEFI)).toBe(
      "https://exemple.fr/quiz/?defi=facile.uuhy9b.13q47wh",
    );
  });
});

/**
 * Un lien vient d'un tiers : il peut être tronqué par une messagerie ou bricolé à
 * la main. `decodeChallenge` renvoie `null` à la moindre anomalie, et le joueur
 * retombe sur le choix du niveau plutôt que sur une partie incohérente.
 */
describe("decodeChallenge — formes invalides", () => {
  for (const [cas, valeur] of [
    ["vide", ""],
    ["nul", null],
    ["sans empreinte", "facile.uuhy9b"],
    ["sans niveau", "uuhy9b.13q47wh"],
    ["un champ de trop", "facile.uuhy9b.13q47wh.zz"],
    ["niveau inconnu", "expert.uuhy9b.13q47wh"],
    ["niveau en majuscules", "FACILE.uuhy9b.13q47wh"],
    ["graine hors alphabet", "facile.UUHY9B.13q47wh"],
    ["graine avec ponctuation", "facile.uu-hy9b.13q47wh"],
    ["graine trop longue", `facile.${"a".repeat(20)}.13q47wh`],
    ["empreinte hors alphabet", "facile.uuhy9b.13Q47WH"],
    ["champ vide au milieu", "facile..13q47wh"],
  ] as const) {
    it(`refuse : ${cas}`, () => {
      expect(decodeChallenge(valeur)).toBeNull();
    });
  }
});

import { describe, expect, it } from "vitest";
import { photoUrl } from "./photoUrl";

describe("photoUrl", () => {
  it("pointe sur le serveur de l'Assemblée, jamais sur une copie locale", () => {
    expect(photoUrl("795998")).toBe(
      "https://www.assemblee-nationale.fr/dyn/static/tribun/17/photos/carre/795998.jpg",
    );
  });

  // L'identifiant vient d'un fichier tiers : s'il déviait, mieux vaut une URL
  // encodée qu'une URL cassée.
  it("encode l'identifiant", () => {
    expect(photoUrl("a b")).toContain("a%20b.jpg");
  });
});

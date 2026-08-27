import { describe, expect, it } from "vitest";
import {
  isNameCorrect,
  levenshtein,
  normalize,
  reservedNames,
  toleranceFor,
} from "./matching";
import type { Deputy } from "./types";

function deputy(firstName: string, lastName: string, aliases: string[] = []): Deputy {
  return {
    id: "1",
    firstName,
    lastName,
    aliases,
    group: "ni",
    department: "Ariège",
    constituency: 1,
    profession: null,
    difficulty: 1,
    sourceUrl: "https://www.assemblee-nationale.fr/dyn/deputes/PA1",
  };
}

describe("normalize", () => {
  it("supprime accents, casse et ponctuation", () => {
    expect(normalize("Éléonore Caroit")).toBe("eleonore caroit");
    expect(normalize("K/Bidi")).toBe("k bidi");
    expect(normalize("Abadie-Amiel")).toBe("abadie amiel");
    expect(normalize("  d'Intignano  ")).toBe("d intignano");
  });
});

describe("levenshtein", () => {
  it("mesure la distance d'édition", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
    expect(levenshtein("abc", "abd")).toBe(1);
    expect(levenshtein("", "abc")).toBe(3);
  });

  // Court = strict : c'est ce qui empêche de valider un nom pour un autre.
  it("durcit la tolérance sur les noms courts", () => {
    expect(toleranceFor("Roux")).toBe(0);
    expect(toleranceFor("Bonnet")).toBe(0);
    expect(toleranceFor("Farandou")).toBe(1);
    expect(toleranceFor("parmentier lecocq")).toBe(2);
  });
});

describe("isNameCorrect", () => {
  const d = deputy("Jean-Pierre", "Farandou");

  it("accepte le nom seul, le nom complet et l'ordre inversé", () => {
    expect(isNameCorrect("Farandou", d)).toBe(true);
    expect(isNameCorrect("Jean-Pierre Farandou", d)).toBe(true);
    expect(isNameCorrect("farandou jean pierre", d)).toBe(true);
  });

  it("tolère une faute sur un nom assez long", () => {
    expect(isNameCorrect("Farandoux", d)).toBe(true);
  });

  it("accepte les alias", () => {
    const avecAlias = deputy("Charles", "de Courson", ["courson"]);
    expect(isNameCorrect("Courson", avecAlias)).toBe(true);
  });

  it("rend les particules facultatives des deux côtés", () => {
    const avecParticule = deputy("Charles", "de Courson");
    expect(isNameCorrect("Courson", avecParticule)).toBe(true);
    expect(isNameCorrect("de Courson", avecParticule)).toBe(true);
  });

  // Le garde-fou : la générosité ne doit pas valider une réponse fausse.
  // Le garde-fou principal, mesuré sur la vraie base : ces paires existent toutes
  // à l'Assemblée et ne doivent jamais se valider l'une pour l'autre.
  it("refuse un nom proche mais différent", () => {
    expect(isNameCorrect("Barnier", deputy("Thomas", "Bannier"))).toBe(false);
    expect(isNameCorrect("Gérard", deputy("Damien", "Girard"))).toBe(false);
    expect(isNameCorrect("Monnet", deputy("Nicolas", "Bonnet"))).toBe(false);
  });

  // Gaillard et Maillard sont à une lettre l'un de l'autre et siègent tous les deux :
  // seul le vivier permet de trancher, la longueur du nom n'y suffit pas.
  it("refuse d'approcher un nom déjà porté par quelqu'un d'autre", () => {
    const gaillard = deputy("Olivia", "Gaillard");
    const maillard = deputy("Sylvain", "Maillard");
    const reserved = reservedNames([gaillard, maillard]);

    expect(isNameCorrect("Maillard", gaillard)).toBe(true); // sans le vivier
    expect(isNameCorrect("Maillard", gaillard, reserved)).toBe(false);
    expect(isNameCorrect("Maillard", maillard, reserved)).toBe(true);
    // Une vraie faute de frappe reste tolérée : « Maillar » n'est le nom de personne.
    // Note : une transposition (« Maillrad ») coûte 2 en Levenshtein simple et sort
    // donc du barème sur huit lettres. C'est une limite connue, assumée ici.
    expect(isNameCorrect("Maillar", maillard, reserved)).toBe(true);
  });

  it("refuse une saisie vide", () => {
    expect(isNameCorrect("", d)).toBe(false);
    expect(isNameCorrect("   ", d)).toBe(false);
  });
});

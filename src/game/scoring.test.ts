import { describe, expect, it } from "vitest";
import { continuesStreak, scoreRound, streakBonus } from "./scoring";

describe("scoreRound", () => {
  it("compte 50 points par bonne réponse", () => {
    expect(scoreRound({ nameFound: true, groupFound: true, hintsUsed: 0 })).toBe(100);
    expect(scoreRound({ nameFound: true, groupFound: false, hintsUsed: 0 })).toBe(50);
  });

  it("retire 10 points par indice", () => {
    expect(scoreRound({ nameFound: true, groupFound: true, hintsUsed: 3 })).toBe(70);
  });

  // Le malus ne doit jamais rendre une manche trouvée déficitaire.
  it("plafonne le malus au plancher de 0", () => {
    expect(scoreRound({ nameFound: false, groupFound: true, hintsUsed: 3 })).toBe(20);
    expect(scoreRound({ nameFound: false, groupFound: false, hintsUsed: 3 })).toBe(0);
  });
});

describe("série", () => {
  it("ne compte que les manches parfaites et sans indice", () => {
    expect(continuesStreak({ nameFound: true, groupFound: true, hintsUsed: 0 })).toBe(
      true,
    );
    expect(continuesStreak({ nameFound: true, groupFound: true, hintsUsed: 1 })).toBe(
      false,
    );
    expect(continuesStreak({ nameFound: true, groupFound: false, hintsUsed: 0 })).toBe(
      false,
    );
  });

  it("ne démarre qu'au-delà du seuil", () => {
    expect(streakBonus(1)).toBe(0);
    expect(streakBonus(2)).toBe(0);
    expect(streakBonus(3)).toBe(25);
  });
});

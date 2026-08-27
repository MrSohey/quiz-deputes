import { describe, expect, it } from "vitest";
import { DEPUTIES, FETCHED_AT } from "./deputies";
import { MAX_MESSAGE_LENGTH, issueBody, issueTitle, issueUrl } from "./issueUrl";
import type { Deputy } from "./types";

const RAMOS: Deputy = {
  id: "720092",
  firstName: "Richard",
  lastName: "Ramos",
  aliases: [],
  group: "dem",
  department: "Loiret",
  constituency: 6,
  profession: null,
  difficulty: 1,
  sourceUrl: "https://www.assemblee-nationale.fr/dyn/deputes/PA720092",
};

const LE = "2026-08-25";

describe("issueBody", () => {
  // L'identifiant est la seule clé qui permette de retrouver la fiche : sans lui,
  // un signalement est inexploitable.
  it("porte l'identifiant entre accents graves", () => {
    expect(issueBody(RAMOS, "groupe faux", LE)).toContain("`720092`");
  });

  it("reprend le message tel quel", () => {
    expect(issueBody(RAMOS, "Il a changé de groupe", LE)).toContain(
      "Il a changé de groupe",
    );
  });

  it("nomme le groupe en clair et par son identifiant", () => {
    const body = issueBody(RAMOS, "", LE);
    expect(body).toContain("Les Démocrates");
    expect(body).toContain("(dem)");
  });

  // La base est périssable : bien souvent « l'erreur » est une donnée qui a vieilli,
  // et la date de collecte suffit à conclure.
  it("indique la date de collecte", () => {
    expect(issueBody(RAMOS, "", LE)).toContain(LE);
  });

  it("reste exploitable quand le message est vide", () => {
    expect(issueBody(RAMOS, "   ", LE)).toContain("aucune précision donnée");
  });

  it("borne le message", () => {
    const body = issueBody(RAMOS, "a".repeat(MAX_MESSAGE_LENGTH + 200), LE);
    expect(body).toContain("a".repeat(MAX_MESSAGE_LENGTH));
    expect(body).not.toContain("a".repeat(MAX_MESSAGE_LENGTH + 1));
  });
});

describe("issueUrl", () => {
  it("vise le formulaire de création d'issue du dépôt", () => {
    expect(issueUrl(RAMOS, "", LE)).toContain(
      "https://github.com/MrSohey/quiz-deputes/issues/new?",
    );
  });

  it("encode sauts de ligne, accents et apostrophes", () => {
    const url = issueUrl(RAMOS, "Le groupe est faux : c'est LIOT", LE);
    expect(url).not.toContain("\n");
    expect(url).not.toContain(" ");
    expect(url).toContain("c%27est+LIOT");
  });

  it("intitule l'issue avec l'identifiant", () => {
    expect(issueTitle(RAMOS)).toBe("Erreur signalée sur la fiche 720092");
  });

  // Borner les caractères ne borne pas l'URL : « é » s'encode sur six. On l'éprouve
  // sur la vraie base, avec le message le plus coûteux possible.
  it("reste sous la limite de GitHub, sur toute la base et en tout accents", () => {
    const message = "é".repeat(MAX_MESSAGE_LENGTH);
    for (const deputy of DEPUTIES) {
      const url = issueUrl(deputy, message, FETCHED_AT);
      expect(url.length, `fiche ${deputy.id}`).toBeLessThan(8000);
      // Le message doit passer en entier : le filet de sécurité ne doit jamais
      // avoir à rogner sur une fiche réelle, sans quoi du texte serait perdu.
      expect(url, `fiche ${deputy.id}`).toContain("%C3%A9".repeat(MAX_MESSAGE_LENGTH));
    }
  });
});

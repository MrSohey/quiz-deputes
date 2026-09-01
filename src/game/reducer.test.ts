import { describe, expect, it } from "vitest";
import { gameReducer, initialState, isRoundOver, roundStatus } from "./reducer";
import type { GameState } from "./reducer";
import type { Deputy, GroupId } from "./types";

function make(id: number, lastName: string, group: GroupId): Deputy {
  return {
    id: String(id),
    firstName: "Camille",
    lastName,
    aliases: [],
    group,
    department: "Ariège",
    constituency: 1,
    profession: null,
    difficulty: 1,
    sourceUrl: `https://www.assemblee-nationale.fr/dyn/deputes/PA${id}`,
  };
}

const NAMES = [
  "Abadie",
  "Bonnet",
  "Chabaud",
  "Dupont",
  "Farandou",
  "Girard",
  "Haddad",
  "Jouvet",
  "Kbidi",
  "Lefevre",
  "Moutchou",
  "Panifous",
];
const POOL = NAMES.map((n, i) => make(i + 1, n, i % 2 === 0 ? "soc" : "rn"));

function started(seed = "abc123"): GameState {
  return gameReducer(initialState(POOL), { type: "start", level: "difficile", seed });
}

describe("start", () => {
  it("ouvre la première manche", () => {
    const state = started();
    expect(state.status).toBe("playing");
    expect(state.round?.index).toBe(0);
    expect(state.lineup).toHaveLength(POOL.length);
  });

  it("est reproductible à graine égale", () => {
    expect(started("xyz").lineup).toEqual(started("xyz").lineup);
    expect(started("xyz").lineup).not.toEqual(started("uvw").lineup);
  });

  /**
   * React StrictMode double-invoque les réducteurs en développement. Si `start`
   * consommait un générateur porté par l'action, la partie divergerait entre
   * développement et production — un bug invisible en local, faussant tous les
   * défis en ligne.
   */
  it("survit à une double invocation", () => {
    const base = initialState(POOL);
    const une = gameReducer(base, { type: "start", level: "difficile", seed: "s" });
    const deux = gameReducer(base, { type: "start", level: "difficile", seed: "s" });
    expect(une.lineup).toEqual(deux.lineup);
  });

  it("plafonne les manches par la taille du vivier", () => {
    const petit = initialState(POOL.slice(0, 3));
    expect(
      gameReducer(petit, { type: "start", level: "difficile", seed: "s" }).roundsInGame,
    ).toBe(3);
  });
});

describe("submit", () => {
  it("verrouille chaque champ trouvé indépendamment", () => {
    let s = started();
    const d = s.round!.deputy;
    s = gameReducer(s, { type: "submit", field: "name", value: d.lastName });
    expect(s.round?.nameFound).toBe(true);
    expect(s.round?.groupFound).toBe(false);
    expect(roundStatus(s.round!)).toBe("nameFound");
  });

  it("clôt la manche quand les deux champs sont trouvés", () => {
    let s = started();
    const d = s.round!.deputy;
    s = gameReducer(s, { type: "submit", field: "name", value: d.lastName });
    s = gameReducer(s, { type: "submit", field: "group", value: d.group });
    expect(isRoundOver(s.round!)).toBe(true);
    expect(s.score).toBe(100);
    expect(s.history).toHaveLength(1);
  });

  it("mémorise la saisie refusée sans clore la manche", () => {
    const s = gameReducer(started(), {
      type: "submit",
      field: "name",
      value: "Zorglub",
    });
    expect(s.round?.lastRejected?.value).toBe("Zorglub");
    expect(isRoundOver(s.round!)).toBe(false);
  });

  // Le garde-fou du vivier passe par l'état : deux noms proches ne se valident
  // jamais l'un pour l'autre.
  it("refuse le nom d'un autre député du vivier", () => {
    const pool = [make(1, "Gaillard", "soc"), make(2, "Maillard", "rn")];
    let s = gameReducer(initialState(pool), {
      type: "start",
      level: "difficile",
      seed: "s",
    });
    const attendu = s.round!.deputy.lastName;
    const autre = attendu === "Gaillard" ? "Maillard" : "Gaillard";
    s = gameReducer(s, { type: "submit", field: "name", value: autre });
    expect(s.round?.nameFound).toBe(false);
  });
});

describe("indices et révélation", () => {
  it("décompte les points par indice", () => {
    let s = started();
    s = gameReducer(s, { type: "requestHint" });
    s = gameReducer(s, { type: "requestHint" });
    const d = s.round!.deputy;
    s = gameReducer(s, { type: "submit", field: "name", value: d.lastName });
    s = gameReducer(s, { type: "submit", field: "group", value: d.group });
    expect(s.score).toBe(80);
  });

  it("ne dépasse pas le nombre d'indices disponibles", () => {
    let s = gameReducer(initialState([make(1, "Dupont", "ni")]), {
      type: "start",
      level: "difficile",
      seed: "s",
    });
    // Un non-inscrit n'a que deux indices : la famille politique est escamotée.
    for (let i = 0; i < 5; i++) s = gameReducer(s, { type: "requestHint" });
    expect(s.round?.hintsUsed).toBe(2);
  });

  it("clôt la manche à zéro point quand on donne la réponse", () => {
    const s = gameReducer(started(), { type: "reveal" });
    expect(s.score).toBe(0);
    expect(roundStatus(s.round!)).toBe("revealed");
  });
});

describe("reset", () => {
  // « Changer de niveau » repasse par là : sans cette action, l'accueil devient
  // inatteignable une fois la première partie lancée.
  it("ramène à l'accueil sans conserver la partie", () => {
    let s = started();
    s = gameReducer(s, { type: "reveal" });
    expect(s.score).toBeGreaterThanOrEqual(0);

    const apres = gameReducer(s, { type: "reset" });
    expect(apres.status).toBe("idle");
    expect(apres.round).toBeNull();
    expect(apres.level).toBeNull();
    expect(apres.seed).toBeNull();
    expect(apres.history).toEqual([]);
    expect(apres.score).toBe(0);
    // La base, elle, survit : c'est elle qui alimente le choix du niveau.
    expect(apres.deputies).toEqual(POOL);
  });

  it("permet de repartir sur un autre niveau", () => {
    const accueil = gameReducer(started(), { type: "reset" });
    const suite = gameReducer(accueil, {
      type: "start",
      level: "difficile",
      seed: "autre",
    });
    expect(suite.status).toBe("playing");
    expect(suite.round).not.toBeNull();
  });
});

describe("enchaînement", () => {
  it("termine la partie après la dernière manche", () => {
    let s = gameReducer(initialState(POOL.slice(0, 2)), {
      type: "start",
      level: "difficile",
      seed: "s",
    });
    for (let i = 0; i < 2; i++) {
      s = gameReducer(s, { type: "reveal" });
      s = gameReducer(s, { type: "nextRound" });
    }
    expect(s.status).toBe("finished");
    expect(s.round).toBeNull();
  });

  it("ne montre jamais deux fois la même personne dans une partie", () => {
    let s = started();
    const vus: string[] = [];
    while (s.round) {
      vus.push(s.round.deputy.id);
      s = gameReducer(s, { type: "reveal" });
      s = gameReducer(s, { type: "nextRound" });
    }
    expect(new Set(vus).size).toBe(vus.length);
  });

  // Le remplaçant vient de la réserve, donc l'ordre reste dicté par la seule graine.
  it("remplace une fiche au portrait indisponible sans changer de manche", () => {
    const s = started();
    const remplacee = s.round!.deputy.id;
    const apres = gameReducer(s, { type: "skipUnavailablePhoto" });
    expect(apres.round?.index).toBe(0);
    expect(apres.round?.deputy.id).not.toBe(remplacee);
  });
});

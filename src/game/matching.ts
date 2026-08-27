/**
 * Comparaison des réponses du joueur. Voir CLAUDE.md §7.4.
 *
 * Principe directeur : être généreux. Un joueur qui écrit « macronistes » ou « epr »
 * a trouvé. La générosité s'arrête là où elle validerait une réponse fausse — d'où
 * l'égalité stricte sur les sigles et l'exigence d'un mot discriminant.
 */
import { GROUPS } from "./groups";
import type { Deputy, GroupId } from "./types";

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/** Minuscules, sans accent, sans ponctuation, espaces compressés. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritiques
    .replace(/[^a-z0-9]+/g, " ") // tirets, apostrophes, ponctuation
    .trim()
    .replace(/\s+/g, " ");
}

/** Particules facultatives des deux côtés : « de Courson » ≡ « Courson ». */
const NAME_PARTICLES = new Set(["de", "du", "des", "d", "le", "la", "van", "von"]);

function stripParticles(tokens: string[]): string[] {
  const kept = tokens.filter((t) => !NAME_PARTICLES.has(t));
  // Un nom entièrement composé de particules ne doit pas devenir une chaîne vide.
  return kept.length > 0 ? kept : tokens;
}

// ---------------------------------------------------------------------------
// Distance de Levenshtein
// ---------------------------------------------------------------------------

/** Distance d'édition classique, en O(n·m) temps et O(m) mémoire. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const substitution = (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1);
      const deletion = (previous[j] ?? 0) + 1;
      const insertion = (current[j - 1] ?? 0) + 1;
      current[j] = Math.min(substitution, deletion, insertion);
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length] ?? 0;
}

/**
 * Tolérance selon la longueur de la référence.
 *
 * Le barème est plus sévère que celui de quiz-ministres, et c'est une conséquence
 * mesurée : sur les 561 noms de famille distincts de l'Assemblée, le barème
 * 5/9 confondait 14 paires de députés RÉELS — Bannier et Barnier, Gaillard et
 * Maillard, Gérard et Girard. Un joueur écrivant « Barnier » se voyait créditer
 * Bannier, ce qui est pire qu'un refus.
 *
 * Le seuil 7/11 ramène ce chiffre à 1 tout en laissant une tolérance à 211 noms sur
 * 561, c'est-à-dire là où les fautes de frappe sont réellement probables. Les noms
 * courts n'en ont guère besoin : on les écrit rarement de travers.
 */
export function toleranceFor(reference: string): number {
  if (reference.length <= 7) return 0;
  if (reference.length <= 11) return 1;
  return 2;
}

function isCloseEnough(input: string, reference: string): boolean {
  return levenshtein(input, reference) <= toleranceFor(reference);
}

// ---------------------------------------------------------------------------
// Acceptation du nom
// ---------------------------------------------------------------------------

/** Toutes les formes acceptables du nom d'une personne, normalisées. */
function nameCandidates(deputy: Deputy): string[] {
  const { firstName, lastName, aliases } = deputy;
  const forms = [
    `${firstName} ${lastName}`,
    lastName,
    `${lastName} ${firstName}`,
    ...aliases,
  ];
  return forms.map((form) => stripParticles(normalize(form).split(" ")).join(" "));
}

/**
 * Noms déjà pris par quelqu'un d'autre dans le vivier.
 *
 * Sert de garde-fou à la tolérance aux fautes : « Gaillard » et « Maillard » sont
 * deux députés réels, séparés d'une seule lettre. Sans cette liste, répondre
 * « Maillard » créditerait Gaillard — ce qui est pire qu'un refus, puisque le jeu
 * confirmerait une erreur au lieu de la corriger.
 */
export function reservedNames(pool: readonly Deputy[]): ReadonlySet<string> {
  const names = new Set<string>();
  for (const deputy of pool) {
    for (const form of nameCandidates(deputy)) names.add(form);
  }
  return names;
}

export function isNameCorrect(
  input: string,
  deputy: Deputy,
  reserved: ReadonlySet<string> = new Set(),
): boolean {
  const answer = stripParticles(normalize(input).split(" ")).join(" ");
  if (answer.length === 0) return false;

  const candidates = nameCandidates(deputy);
  if (candidates.includes(answer)) return true;

  // Une saisie qui est EXACTEMENT le nom d'un autre député n'est pas une faute de
  // frappe : c'est quelqu'un d'autre. On ne l'approche donc pas de celui-ci.
  if (reserved.has(answer)) return false;

  return candidates.some((candidate) => isCloseEnough(answer, candidate));
}

// ---------------------------------------------------------------------------
// Acceptation du groupe
// ---------------------------------------------------------------------------

/**
 * Mots vides du domaine, retirés partout. « Socialistes ET APPARENTÉS » doit se
 * réduire au même jeu de mots que « socialistes ».
 */
// Une liste de mots vides se lit en bloc, pas à raison d'un mot par ligne.
// La directive doit être seule sur sa ligne : Prettier l'ignore sinon.
// prettier-ignore
const GROUP_STOP_WORDS = new Set([
  "groupe", "apparentes", "apparente",
  "de", "du", "des", "d", "la", "le", "les", "l", "a", "au", "aux", "et", "en", "pour",
]);

function groupTokens(input: string): string[] {
  return normalize(input)
    .split(" ")
    .filter((token) => token.length > 0 && !GROUP_STOP_WORDS.has(token));
}

function groupKey(input: string): string {
  return groupTokens(input).join(" ");
}

/** Toutes les appellations complètes d'un groupe (hors sigles). */
function labelsOf(group: (typeof GROUPS)[number]): string[] {
  return [group.officialLabel, ...group.aliases];
}

/**
 * Mots n'apparaissant que dans les appellations d'un seul groupe.
 *
 * Dérivé de la table au chargement, jamais écrit à la main. Sans cette notion,
 * « indépendants » validerait indifféremment Horizons et LIOT, et « républicaine »
 * la Droite Républicaine et la Gauche Démocrate et Républicaine.
 */
const DISCRIMINATING_WORDS: ReadonlySet<string> = (() => {
  const owners = new Map<string, Set<GroupId>>();
  for (const group of GROUPS) {
    for (const label of labelsOf(group)) {
      for (const token of groupTokens(label)) {
        let set = owners.get(token);
        if (!set) owners.set(token, (set = new Set()));
        set.add(group.id);
      }
    }
  }
  const discriminating = new Set<string>();
  for (const [token, ids] of owners) {
    if (ids.size === 1) discriminating.add(token);
  }
  return discriminating;
})();

/** Exposé pour les tests et le débogage de la table. */
export function isDiscriminatingWord(word: string): boolean {
  return DISCRIMINATING_WORDS.has(normalize(word));
}

/** Une saisie courte et sans espace est traitée comme un sigle. */
function looksLikeAcronym(normalized: string): boolean {
  return normalized.length > 0 && normalized.length <= 5 && !normalized.includes(" ");
}

/**
 * Résout une saisie libre vers les groupes compatibles.
 *
 * Étapes ordonnées du plus strict au plus permissif ; on s'arrête à la première qui
 * donne un résultat.
 */
export function resolveGroup(input: string): GroupId[] {
  const normalized = normalize(input);
  if (normalized.length === 0) return [];

  // 1. Sigles, en égalité stricte. Terminal en cas de succès.
  const byAcronym = GROUPS.filter((g) =>
    g.acronyms.some((acronym) => normalize(acronym) === normalized),
  );
  if (byAcronym.length > 0) return byAcronym.map((g) => g.id);

  const key = groupKey(input);
  if (key.length === 0) return []; // saisie faite uniquement de mots vides

  // 2. Égalité avec un intitulé, mots vides retirés.
  //
  // AVANT le rejet des sigles inconnus : « verts » et « ecos » font cinq lettres
  // sans espace et seraient sinon pris pour des sigles inconnus.
  const byLabel = GROUPS.filter((g) =>
    labelsOf(g).some((label) => groupKey(label) === key),
  );
  if (byLabel.length > 0) return byLabel.map((g) => g.id);

  // 3. Sigle inconnu : terminal. Sur deux ou trois lettres, une tolérance d'un
  // caractère rendrait `dr`, `gdr` et `udr` équivalents — on ne devine pas.
  if (looksLikeAcronym(normalized)) return [];

  // 4. Inclusion de mots, à condition d'en avoir un discriminant.
  const answerTokens = groupTokens(input);
  if (answerTokens.some((token) => DISCRIMINATING_WORDS.has(token))) {
    const bySubset = GROUPS.filter((g) =>
      labelsOf(g).some((label) => {
        const labelTokens = new Set(groupTokens(label));
        return answerTokens.every((token) => labelTokens.has(token));
      }),
    );
    if (bySubset.length > 0) return bySubset.map((g) => g.id);
  }

  // 5. Tolérance aux fautes, en dernier recours.
  const byFuzzy = GROUPS.filter((g) =>
    labelsOf(g).some((label) => isCloseEnough(key, groupKey(label))),
  );
  return byFuzzy.map((g) => g.id);
}

/**
 * La réponse est correcte si le groupe du député figure parmi ceux résolus.
 *
 * Une saisie ambiguë est donc tranchée en faveur du joueur, comme dans
 * quiz-ministres. La différence est qu'ici un seul groupe est juste : la générosité
 * repose entièrement sur l'exigence d'un mot discriminant à l'étape 4, sans laquelle
 * un mot vague suffirait à gagner.
 */
export function isGroupCorrect(input: string, deputy: Deputy): boolean {
  return resolveGroup(input).includes(deputy.group);
}

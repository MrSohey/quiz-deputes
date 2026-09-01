import { useReducer, useState } from "react";
import { AnswerForm } from "./components/AnswerForm";
import { CreditsPage } from "./components/CreditsPage";
import { EndScreen } from "./components/EndScreen";
import { HintPanel } from "./components/HintPanel";
import { LevelPicker } from "./components/LevelPicker";
import { PhotoCard } from "./components/PhotoCard";
import { RevealPanel } from "./components/RevealPanel";
import { ScoreBar } from "./components/ScoreBar";
import { ShareChallenge } from "./components/ShareChallenge";
import { ShareLink } from "./components/ShareLink";
import { StaleChallengeNotice } from "./components/StaleChallengeNotice";
import { bestScoreStorageKey } from "./game/config";
import { challengeUrl, readChallengeFromLocation } from "./game/challenge";
import { DEPUTIES, FETCHED_AT } from "./game/deputies";
import { hintsFor } from "./game/hints";
import { gameReducer, initialState, isRoundOver } from "./game/reducer";
import { LEVEL_BY_ID, LEVEL_IDS, deputiesForLevel, type LevelId } from "./game/levels";
import { poolFingerprint, randomSeed } from "./game/seed";

/**
 * En navigation privée ou stockage refusé, `localStorage` lève. Le jeu doit rester
 * jouable : on avale l'erreur plutôt que de casser la page pour un score.
 */
type BestScores = Record<LevelId, number | null>;

function readBestScores(): BestScores {
  const scores = {} as BestScores;
  for (const level of LEVEL_IDS) {
    scores[level] = null;
    try {
      const raw = localStorage.getItem(bestScoreStorageKey(level));
      const value = raw === null ? NaN : Number(raw);
      if (Number.isFinite(value)) scores[level] = value;
    } catch {
      // Stockage refusé : on joue sans meilleur score.
    }
  }
  return scores;
}

function writeBestScore(level: LevelId, score: number): void {
  try {
    localStorage.setItem(bestScoreStorageKey(level), String(score));
  } catch {
    // Rien à faire : le score n'est pas conservé, la partie continue.
  }
}

export function App() {
  const [state, dispatch] = useReducer(gameReducer, DEPUTIES, initialState);
  const [bestScores, setBestScores] = useState<BestScores>(readBestScores);
  /** Figé au démarrage : sinon « Nouveau record » ne s'afficherait jamais. */
  const [bestBeforeGame, setBestBeforeGame] = useState<number | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [staleChallenge, setStaleChallenge] = useState(false);
  /**
   * Défi lu dans l'adresse, UNE SEULE FOIS au chargement de la page.
   *
   * Il est consommé au premier démarrage, puis oublié. Sans cela, « Rejouer »
   * relancerait indéfiniment la même partie : l'adresse porte encore le défi
   * précédent, puisque `start` l'y a écrit.
   */
  const [pendingChallenge, setPendingChallenge] = useState(() =>
    readChallengeFromLocation(window.location.search),
  );

  /** L'empreinte porte sur le vivier DU NIVEAU : c'est lui que la graine mélange. */
  const fingerprintOf = (level: LevelId) =>
    poolFingerprint(deputiesForLevel(DEPUTIES, level));
  /** Mise en forme faite ici pour garder `issueUrl` pur et testable. */
  const collectedOn = new Date(FETCHED_AT).toLocaleDateString("fr-FR");

  /**
   * Lance une partie sur une graine DONNÉE.
   *
   * La graine est toujours un argument, jamais lue ici : c'est ce qui rend
   * impossible de rejouer par accident la partie précédente.
   */
  function startGame(level: LevelId, seed: string) {
    setBestBeforeGame(bestScores[level]);
    dispatch({ type: "start", level, seed });

    // `replaceState` et non `pushState` : ce dernier empilerait une entrée par
    // partie et rendrait le bouton « retour » inutilisable.
    window.history.replaceState(
      null,
      "",
      challengeUrl(window.location.origin, window.location.pathname, {
        level,
        seed,
        fingerprint: fingerprintOf(level),
      }),
    );
  }

  /**
   * Choix d'un niveau. Le défi de l'adresse n'est honoré que s'il porte sur CE
   * niveau : une graine tirée pour un vivier n'a pas de sens sur un autre.
   */
  function handleStart(level: LevelId) {
    const challenge = pendingChallenge;
    setPendingChallenge(null);
    const applicable = challenge !== null && challenge.level === level;
    setStaleChallenge(applicable && challenge.fingerprint !== fingerprintOf(level));
    startGame(level, applicable ? challenge.seed : randomSeed());
  }

  /** « Rejouer » : même niveau, partie neuve. L'adresse n'est pas consultée. */
  function handleRestart() {
    if (!state.level) return;
    setStaleChallenge(false);
    startGame(state.level, randomSeed());
  }

  /**
   * « Changer de niveau » : retour à l'accueil.
   *
   * Le défi est retiré de l'adresse : la partie qu'il désigne est terminée, et le
   * laisser afficherait un lien de défi périmé pendant le choix du niveau.
   */
  function handleChangeLevel() {
    setStaleChallenge(false);
    window.history.replaceState(null, "", window.location.pathname);
    dispatch({ type: "reset" });
  }

  function handleNext() {
    const round = state.round;
    const isLast = round !== null && round.index + 1 >= state.roundsInGame;
    const level = state.level;
    if (isLast && level) {
      // Persistance dans le gestionnaire d'événement, jamais dans un effet : un
      // effet se rejouerait à chaque rendu et brouillerait la détection du record.
      const best = bestScores[level];
      if (best === null || state.score > best) {
        writeBestScore(level, state.score);
        setBestScores({ ...bestScores, [level]: state.score });
      }
    }
    dispatch({ type: "nextRound" });
  }

  if (showCredits) {
    return (
      <main className="app">
        <CreditsPage fetchedAt={FETCHED_AT} onClose={() => setShowCredits(false)} />
      </main>
    );
  }

  if (state.status === "idle") {
    return (
      <main className="app">
        <h1>Quiz des députés</h1>
        <LevelPicker
          deputies={DEPUTIES}
          bestScores={bestScores}
          onStart={handleStart}
          onCredits={() => setShowCredits(true)}
        />
      </main>
    );
  }

  // Calculé avant les retours anticipés : l'écran de fin en a besoin autant que
  // l'écran de manche.
  const shareUrl =
    state.seed && state.level
      ? challengeUrl(window.location.origin, window.location.pathname, {
          level: state.level,
          seed: state.seed,
          fingerprint: fingerprintOf(state.level),
        })
      : "";

  if (state.status === "finished") {
    const isNewRecord =
      bestBeforeGame === null ? state.score > 0 : state.score > bestBeforeGame;
    return (
      <main className="app">
        <h1>Quiz des députés</h1>
        <EndScreen
          score={state.score}
          levelLabel={state.level ? (LEVEL_BY_ID.get(state.level)?.label ?? "") : ""}
          bestScore={state.level ? bestScores[state.level] : null}
          isNewRecord={isNewRecord}
          history={state.history}
          onRestart={handleRestart}
          onChangeLevel={handleChangeLevel}
        />
        {shareUrl && <ShareChallenge url={shareUrl} />}
      </main>
    );
  }

  const round = state.round;
  if (!round) return null;

  return (
    <main className="app">
      <h1>Quiz des députés</h1>
      {staleChallenge && <StaleChallengeNotice />}
      <ScoreBar
        roundNumber={round.index + 1}
        roundsInGame={state.roundsInGame}
        score={state.score}
        streak={state.streak}
      />
      <section className="panel">
        <PhotoCard
          deputy={round.deputy}
          next={state.lineup[state.cursor] ?? null}
          onUnavailable={() => dispatch({ type: "skipUnavailablePhoto" })}
        />

        {isRoundOver(round) ? null : (
          // Remonté à chaque manche : sans `key`, le texte saisi resterait d'une
          // personne à l'autre.
          <AnswerForm
            key={round.deputy.id}
            round={round}
            onSubmit={(field, value) => dispatch({ type: "submit", field, value })}
            onHint={() => dispatch({ type: "requestHint" })}
            onReveal={() => dispatch({ type: "reveal" })}
            onTyping={() => dispatch({ type: "dismissRejection" })}
          />
        )}

        <HintPanel hints={hintsFor(round.deputy, round.hintsUsed)} />
      </section>

      {isRoundOver(round) && (
        <RevealPanel
          round={round}
          isLastRound={round.index + 1 >= state.roundsInGame}
          collectedOn={collectedOn}
          onNext={handleNext}
        />
      )}

      <ShareLink url={shareUrl} />
      <p className="share-inline">
        <button
          type="button"
          className="share-inline__button"
          onClick={() => setShowCredits(true)}
        >
          Crédits et sources
        </button>
      </p>
    </main>
  );
}

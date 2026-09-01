import { GROUP_BY_ID } from "../game/groups";
import type { Round } from "../game/reducer";

interface Props {
  score: number;
  levelLabel: string;
  bestScore: number | null;
  isNewRecord: boolean;
  history: readonly Round[];
  onRestart: () => void;
  onChangeLevel: () => void;
}

export function EndScreen({
  score,
  levelLabel,
  bestScore,
  isNewRecord,
  history,
  onRestart,
  onChangeLevel,
}: Props) {
  return (
    <section className="panel">
      {/* `h2` et non `h1` : le titre du jeu, rendu par `App`, occupe déjà ce rang. */}
      <h2>Partie terminée — niveau {levelLabel.toLowerCase()}</h2>
      <p>
        Score : <strong>{score}</strong>
      </p>
      {isNewRecord ? (
        <p className="muted">🎉 Nouveau record&nbsp;!</p>
      ) : (
        bestScore !== null && <p className="muted">Meilleur score : {bestScore}</p>
      )}

      <ul className="recap">
        {history.map((round) => (
          <li key={round.deputy.id}>
            <span>
              {round.deputy.firstName} {round.deputy.lastName}
              <span className="muted">
                {" "}
                — {GROUP_BY_ID.get(round.deputy.group)?.officialAbbreviation}
              </span>
            </span>
            <span>{round.points ?? 0}</span>
          </li>
        ))}
      </ul>

      <div className="actions">
        <button type="button" className="primary" onClick={onRestart} autoFocus>
          Rejouer en {levelLabel.toLowerCase()}
        </button>
        <button type="button" onClick={onChangeLevel}>
          Changer de niveau
        </button>
      </div>
    </section>
  );
}

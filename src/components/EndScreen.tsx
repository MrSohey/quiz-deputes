import { GROUP_BY_ID } from "../game/groups";
import type { Round } from "../game/reducer";

interface Props {
  score: number;
  levelLabel: string;
  bestScore: number | null;
  isNewRecord: boolean;
  history: readonly Round[];
  onRestart: () => void;
}

export function EndScreen({
  score,
  levelLabel,
  bestScore,
  isNewRecord,
  history,
  onRestart,
}: Props) {
  return (
    <section className="panel">
      <h1>Partie terminée</h1>
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

      <button type="button" className="primary" onClick={onRestart} autoFocus>
        Rejouer en {levelLabel.toLowerCase()}
      </button>
    </section>
  );
}

interface Props {
  roundNumber: number;
  roundsInGame: number;
  score: number;
  streak: number;
}

export function ScoreBar({ roundNumber, roundsInGame, score, streak }: Props) {
  return (
    <div className="scorebar">
      {/* Le point final évite que les lecteurs d'écran lisent « 10100 points ». */}
      <span>
        Manche {roundNumber} sur {roundsInGame}
        <span className="visually-hidden">.</span>
      </span>
      <span>
        Score : {score}
        {streak > 1 && <span className="scorebar__streak"> · série de {streak}</span>}
      </span>
    </div>
  );
}

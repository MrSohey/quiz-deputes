import { GROUP_BY_ID } from "../game/groups";
import type { Round } from "../game/reducer";
import { ReportErrorForm } from "./ReportErrorForm";

interface Props {
  round: Round;
  isLastRound: boolean;
  /** Date de collecte, déjà mise en forme, pour le corps du signalement. */
  collectedOn: string;
  onNext: () => void;
}

/** « 1re » et non « 1e » : c'est la forme utilisée par l'Assemblée. */
function ordinal(n: number): string {
  return n === 1 ? "1re" : `${n}e`;
}

export function RevealPanel({ round, isLastRound, collectedOn, onNext }: Props) {
  const { deputy, points } = round;
  const group = GROUP_BY_ID.get(deputy.group);
  const solved = round.nameFound && round.groupFound;

  return (
    <section className="panel reveal" aria-live="polite">
      <h2>
        {deputy.firstName} {deputy.lastName}
      </h2>
      <p className="reveal__group">
        {group?.officialLabel}{" "}
        <span className="muted">({group?.officialAbbreviation})</span>
      </p>
      <p className="reveal__meta">
        {deputy.department}, {ordinal(deputy.constituency)} circonscription
      </p>

      <p className="reveal__points">
        {solved ? "Trouvé" : "Réponse donnée"} — {points ?? 0} point
        {(points ?? 0) > 1 ? "s" : ""}
      </p>

      <p className="muted">
        <a href={deputy.sourceUrl} target="_blank" rel="noreferrer">
          Voir la fiche officielle
        </a>
      </p>

      <button type="button" className="primary" onClick={onNext} autoFocus>
        {isLastRound ? "Voir le résultat" : "Personne suivante"}
      </button>

      {/* Remonté à chaque personne : sans `key`, un texte saisi sur une fiche
          resterait ouvert et rattaché à la suivante. */}
      <ReportErrorForm key={deputy.id} deputy={deputy} fetchedAt={collectedOn} />
    </section>
  );
}

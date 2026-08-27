import { useState } from "react";
import { MAX_MESSAGE_LENGTH, issueUrl } from "../game/issueUrl";
import type { Deputy } from "../game/types";

interface Props {
  deputy: Deputy;
  fetchedAt: string;
}

/**
 * L'exemple porte sur un changement de groupe, de loin le défaut le plus fréquent
 * ici : la composition de l'Assemblée bouge en permanence, et c'est le groupe — la
 * réponse attendue — qui change le plus souvent.
 *
 * Formulation neutre en genre, comme partout dans l'interface (CLAUDE.md §8.3).
 */
const PLACEHOLDER =
  "Par exemple : cette personne a changé de groupe, elle ne siège plus chez les Démocrates.";

/**
 * Signalement d'une erreur de fiche, par ouverture d'une issue GitHub pré-remplie.
 *
 * Sans backend, le jeu ne peut ni recevoir ni stocker un signalement. Le déclencheur
 * est un `<a>` et non un `window.open` : une navigation issue d'un clic passe les
 * bloqueurs de fenêtres, un appel programmatique pas toujours.
 *
 * Le champ est facultatif : une fiche identifiée sans commentaire reste un
 * signalement exploitable, alors qu'un champ obligatoire décourage.
 */
export function ReportErrorForm({ deputy, fetchedAt }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const fieldId = `report-${deputy.id}`;

  if (!open) {
    return (
      <button
        type="button"
        className="report__toggle"
        aria-expanded={false}
        onClick={() => setOpen(true)}
      >
        Signaler une erreur
      </button>
    );
  }

  return (
    <div className="report">
      <label htmlFor={fieldId}>Que faut-il corriger sur cette fiche&nbsp;?</label>
      <textarea
        id={fieldId}
        className="report__message"
        rows={3}
        maxLength={MAX_MESSAGE_LENGTH}
        value={message}
        placeholder={PLACEHOLDER}
        onChange={(event) => setMessage(event.target.value)}
        autoFocus
      />
      <p className="report__hint">
        Le signalement s&apos;ouvre sur GitHub, la fiche déjà décrite. Un compte GitHub
        est nécessaire pour l&apos;envoyer.
      </p>
      <div className="report__actions">
        <a
          className="primary"
          href={issueUrl(deputy, message, fetchedAt)}
          target="_blank"
          rel="noreferrer"
        >
          Ouvrir le signalement
        </a>
        <button type="button" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </div>
    </div>
  );
}

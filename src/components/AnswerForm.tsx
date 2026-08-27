import { useState, type FormEvent } from "react";
import { GROUPS } from "../game/groups";
import { hasMoreHints, maxHintsFor } from "../game/hints";
import type { AnswerField, Round } from "../game/reducer";

interface Props {
  round: Round;
  onSubmit: (field: AnswerField, value: string) => void;
  onHint: () => void;
  onReveal: () => void;
  onTyping: () => void;
}

/**
 * Les deux champs sont indépendants : trouver le nom ne révèle pas le groupe.
 * Chaque champ trouvé se verrouille et cesse d'être éditable.
 *
 * Ce composant est remonté à chaque manche (`key` sur l'identifiant du député dans
 * `App`) : sans cela, le texte saisi resterait d'une personne à l'autre.
 */
export function AnswerForm({ round, onSubmit, onHint, onReveal, onTyping }: Props) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");

  const rejected = round.lastRejected;
  const hintsLeft = hasMoreHints(round.deputy, round.hintsUsed);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!round.nameFound && name.trim().length > 0) onSubmit("name", name);
    if (!round.groupFound && group.trim().length > 0) onSubmit("group", group);
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        {round.nameFound ? (
          <p className="field__found">✓ Nom trouvé</p>
        ) : (
          <>
            <label htmlFor="answer-name">Qui est-ce&nbsp;?</label>
            <input
              id="answer-name"
              value={name}
              autoFocus
              autoComplete="off"
              aria-invalid={rejected?.field === "name"}
              onChange={(e) => {
                setName(e.target.value);
                onTyping();
              }}
            />
          </>
        )}
      </div>

      <div className="field">
        {round.groupFound ? (
          <p className="field__found">✓ Groupe trouvé</p>
        ) : (
          <>
            <label htmlFor="answer-group">
              Dans quel groupe siège cette personne&nbsp;?
            </label>
            <input
              id="answer-group"
              value={group}
              list="groupes"
              autoComplete="off"
              aria-invalid={rejected?.field === "group"}
              onChange={(e) => {
                setGroup(e.target.value);
                onTyping();
              }}
            />
            {/* Suggestions non contraignantes : la validation part du texte saisi. */}
            <datalist id="groupes">
              {GROUPS.map((g) => (
                <option key={g.id} value={g.officialLabel} />
              ))}
            </datalist>
          </>
        )}
      </div>

      {rejected && (
        <p className="field__error" role="status">
          ✗ Pas tout à fait… « {rejected.value} » ne convient pas.
        </p>
      )}

      <div className="actions">
        <button type="submit" className="primary">
          Valider
        </button>
        {hintsLeft ? (
          <button type="button" onClick={onHint}>
            Indice ({round.hintsUsed + 1}/{maxHintsFor(round.deputy)})
          </button>
        ) : (
          <button type="button" onClick={onReveal}>
            Donner la réponse
          </button>
        )}
        {/* « Passer » clôt la manche comme « Donner la réponse » : dans les deux cas
            on renonce, et la fiche est révélée. Le libellé diffère parce que
            l'intention diffère — abandonner ou apprendre. */}
        <button type="button" onClick={onReveal}>
          Passer
        </button>
      </div>
    </form>
  );
}

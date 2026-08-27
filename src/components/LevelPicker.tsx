import { LEVELS, deputiesForLevel, type LevelId } from "../game/levels";
import type { Deputy } from "../game/types";

interface Props {
  deputies: readonly Deputy[];
  /** Meilleur score par niveau, `null` si jamais joué. */
  bestScores: Readonly<Record<LevelId, number | null>>;
  onStart: (level: LevelId) => void;
  onCredits: () => void;
}

/**
 * Choix du niveau, écran d'accueil du jeu.
 *
 * Tout le contenu d'un niveau — nom, critère, taille du vivier, record — tient
 * DANS le bouton : la cible tactile couvre alors toute la carte, et le regard n'a
 * pas à faire l'aller-retour entre un bouton et le texte qui le décrit.
 *
 * La taille du vivier est annoncée : c'est ce qui rend le choix éclairé, et ce qui
 * fait comprendre d'un coup d'œil que les niveaux sont gigognes.
 */
export function LevelPicker({ deputies, bestScores, onStart, onCredits }: Props) {
  return (
    <section className="panel panel--text">
      <h2>Choisissez un niveau</h2>
      <p>
        Un portrait, deux questions&nbsp;: le nom de la personne et le groupe politique où
        elle siège. Trois indices sont disponibles à la demande, chacun coûte
        10&nbsp;points.
      </p>

      <ul className="levels">
        {LEVELS.map((level, index) => {
          const size = deputiesForLevel(deputies, level.id).length;
          const best = bestScores[level.id];
          return (
            <li key={level.id}>
              <button
                type="button"
                className={index === 0 ? "level primary" : "level"}
                onClick={() => onStart(level.id)}
                autoFocus={index === 0}
              >
                <span className="level__name">{level.label}</span>
                <span className="level__desc">{level.description}</span>
                <span className="level__meta">
                  {size} députés
                  {best !== null && ` · record ${best} pts`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="muted">
        Le meilleur score de chaque niveau est conservé dans votre navigateur, en local.
        Aucun cookie, aucun traçage, aucune donnée envoyée.
      </p>

      <button type="button" onClick={onCredits}>
        Crédits et sources
      </button>
    </section>
  );
}

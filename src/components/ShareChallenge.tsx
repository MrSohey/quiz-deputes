import { useClipboard } from "./useClipboard";

interface Props {
  url: string;
}

/**
 * Panneau de partage affiché en fin de partie. Voir CLAUDE.md §7.6.
 *
 * Le lien reste visible et sélectionnable : la copie par le presse-papiers exige un
 * contexte sécurisé et peut être refusée, le bouton n'en est qu'un raccourci.
 */
export function ShareChallenge({ url }: Props) {
  const { copied, copy } = useClipboard();

  return (
    <section className="share">
      <h3>Défier quelqu&apos;un</h3>
      <p className="muted">
        Ce lien rejoue exactement la même partie&nbsp;: mêmes députés, même ordre.
      </p>
      <div className="share__row">
        <input
          className="share__url"
          value={url}
          readOnly
          aria-label="Lien du défi"
          onFocus={(event) => event.currentTarget.select()}
        />
        <button type="button" onClick={() => copy(url)}>
          Copier
        </button>
      </div>
      {/* `role="status"` fait annoncer la confirmation par les lecteurs d'écran. */}
      <p className="muted" role="status">
        {copied ? "Lien copié." : " "}
      </p>
      {/* Propre à ce jeu : la composition de l'Assemblée bouge, et le lien vieillit
          donc plus vite que dans quiz-ministres. Mieux vaut le dire que laisser
          croire à une promesse indéfinie. */}
      <p className="muted">
        Il reste valable tant que la composition de l&apos;Assemblée ne change pas ;
        au-delà, la personne prévenue jouera une partie légèrement différente.
      </p>
    </section>
  );
}

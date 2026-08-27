interface Props {
  fetchedAt: string;
  onClose: () => void;
}

/**
 * Page de crédits. Elle n'est pas décorative : la Licence Ouverte impose de citer
 * la source et sa version, et les mentions légales de l'Assemblée imposent de ne
 * pas s'approprier les portraits (CLAUDE.md §6.3 et §14).
 */
export function CreditsPage({ fetchedAt, onClose }: Props) {
  const date = new Date(fetchedAt).toLocaleDateString("fr-FR");
  return (
    <section className="panel credits">
      <div className="credits__header">
        <h2>Crédits et sources</h2>
        <button
          type="button"
          className="credits__close"
          onClick={onClose}
          aria-label="Revenir au jeu"
          autoFocus
        >
          ×
        </button>
      </div>

      <h3>Données</h3>
      <p>
        Composition de l'Assemblée nationale, publiée en{" "}
        <a href="https://data.assemblee-nationale.fr/" target="_blank" rel="noreferrer">
          open data
        </a>{" "}
        sous <strong>Licence Ouverte / Etalab</strong>. Version utilisée&nbsp;: collecte
        du {date}.
      </p>
      <p className="muted">
        La composition évolue — démissions, élections partielles, changements de groupe.
        Si une réponse vous paraît fausse, c'est peut-être que les données ont vieilli
        depuis cette date.
      </p>

      <h3>Portraits</h3>
      <p>
        © Assemblée nationale. Les portraits <strong>ne sont pas hébergés ici</strong>
        &nbsp;: ils sont affichés par lien depuis le site de l'Assemblée, qui autorise les
        liens vers son contenu mais interdit la reproduction de ses photographies.
      </p>

      <h3>Usage</h3>
      <p>
        Jeu gratuit, sans publicité et sans usage commercial, conformément aux mentions
        légales de l'Assemblée nationale. Aucun cookie, aucun traçage&nbsp;: seul le
        meilleur score est conservé dans votre navigateur.
      </p>

      <div className="actions">
        <button type="button" onClick={onClose}>
          Revenir au jeu
        </button>
      </div>
    </section>
  );
}

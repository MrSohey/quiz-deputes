import { useClipboard } from "./useClipboard";

interface Props {
  url: string;
}

/**
 * Double la barre d'adresse pendant la partie, et ce n'est pas redondant : sur
 * mobile, l'URL disparaît dès qu'on fait défiler la page, et c'est là que le jeu
 * se joue le plus.
 */
export function ShareLink({ url }: Props) {
  const { copied, copy } = useClipboard();
  return (
    <p className="share-inline">
      <button type="button" className="share-inline__button" onClick={() => copy(url)}>
        Partager cette partie
      </button>
      {copied && <span className="muted">lien copié</span>}
    </p>
  );
}

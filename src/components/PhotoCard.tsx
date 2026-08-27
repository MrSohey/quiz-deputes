import { useEffect } from "react";
import { photoUrl } from "../game/photoUrl";
import type { Deputy } from "../game/types";

interface Props {
  deputy: Deputy;
  /** Portrait suivant, préchargé pour masquer la latence réseau. */
  next: Deputy | null;
  onUnavailable: () => void;
}

export function PhotoCard({ deputy, next, onUnavailable }: Props) {
  useEffect(() => {
    if (!next) return;
    // Préchargement : le portrait suivant est déjà en cache quand la manche change.
    const image = new Image();
    image.src = photoUrl(next.id);
  }, [next]);

  return (
    <div className="photo">
      <img
        src={photoUrl(deputy.id)}
        // L'alternative ne doit rien divulguer : c'est la réponse attendue.
        alt="Portrait de la personne à identifier"
        onError={() => {
          console.warn(`Portrait indisponible : ${deputy.id} (${deputy.lastName})`);
          onUnavailable();
        }}
      />
    </div>
  );
}

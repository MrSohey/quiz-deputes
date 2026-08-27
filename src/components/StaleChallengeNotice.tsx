/**
 * N'annonce QUE l'anomalie.
 *
 * Puisque l'URL porte la graine dès la première manche, un simple rechargement
 * emprunte exactement le même chemin qu'un lien reçu d'un tiers : les deux cas
 * étant indiscernables, un message « vous jouez un défi » serait faux une fois sur
 * deux. On ne parle donc que quand l'empreinte ne correspond plus.
 */
export function StaleChallengeNotice() {
  return (
    <p className="notice" role="status">
      ⚠️ Ce défi a été créé avec une composition différente de l'Assemblée. Les députés
      tirés ne seront pas exactement les mêmes : la comparaison des scores perd son sens.
    </p>
  );
}

/**
 * Lien vers une issue GitHub pré-remplie, pour signaler une erreur de fiche.
 *
 * Le jeu n'a pas de backend (CLAUDE.md §1) : il ne peut ni recevoir ni stocker un
 * signalement. On délègue à GitHub, qui authentifie déjà la personne, horodate le
 * message et le range à côté du code. Rien n'est envoyé tant que le lien n'est pas
 * validé.
 *
 * Le besoin est plus fort ici que dans quiz-ministres : la base est **périssable**
 * (§5.2). Un joueur à qui le jeu refuse une bonne réponse est souvent le premier à
 * savoir qu'un député a changé de groupe. D'où la date de collecte dans le corps du
 * message : elle suffit parfois à conclure sans enquête.
 */
import { GROUP_BY_ID } from "./groups";
import type { Deputy } from "./types";

const REPOSITORY = "MrSohey/quiz-deputes";

/**
 * Au-delà d'environ 8 ko d'URL, GitHub renvoie une erreur au lieu du formulaire.
 * On vise nettement en dessous, la fiche occupant déjà une part du corps.
 */
const MAX_URL_LENGTH = 6000;

/**
 * Borne du texte libre, en caractères saisis.
 *
 * Attention au piège : borner les CARACTÈRES ne borne pas l'URL. Un caractère
 * accentué s'encode sur six (`%C3%A9`), si bien qu'un message en français de 1500
 * caractères produisait un lien de 10 000 caractères, refusé par GitHub. 750
 * caractères tiennent sous la limite même s'ils sont tous accentués.
 */
export const MAX_MESSAGE_LENGTH = 750;

/** Corps de l'issue, en Markdown. */
export function issueBody(deputy: Deputy, message: string, fetchedAt: string): string {
  const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  const group = GROUP_BY_ID.get(deputy.group);
  return [
    "### Signalement",
    "",
    trimmed || "_(aucune précision donnée)_",
    "",
    "### Fiche concernée",
    "",
    `- Identifiant : \`${deputy.id}\``,
    `- Nom : ${deputy.firstName} ${deputy.lastName}`,
    `- Groupe : ${group?.officialLabel ?? deputy.group} (${deputy.group})`,
    `- Circonscription : ${deputy.department}, ${deputy.constituency}`,
    `- Fiche officielle : ${deputy.sourceUrl}`,
    "",
    // La composition bouge : bien souvent, « l'erreur » est une donnée qui a vieilli.
    `_Données collectées le ${fetchedAt}. Signalement envoyé depuis le jeu._`,
  ].join("\n");
}

export function issueTitle(deputy: Deputy): string {
  return `Erreur signalée sur la fiche ${deputy.id}`;
}

function build(deputy: Deputy, message: string, fetchedAt: string): string {
  // URLSearchParams encode tout ce qui doit l'être : accents, sauts de ligne,
  // apostrophes. Concaténer à la main casserait les corps multi-lignes.
  const params = new URLSearchParams({
    title: issueTitle(deputy),
    body: issueBody(deputy, message, fetchedAt),
    labels: "donnée",
  });
  return `https://github.com/${REPOSITORY}/issues/new?${params.toString()}`;
}

export function issueUrl(deputy: Deputy, message: string, fetchedAt: string): string {
  let text = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  let url = build(deputy, text, fetchedAt);
  // Filet de sécurité : un nom ou une circonscription anormalement longs pourraient
  // rapprocher le lien de la limite. On raccourcit alors la fin du message plutôt
  // que de produire une URL que GitHub refuserait d'ouvrir.
  while (url.length > MAX_URL_LENGTH && text.length > 0) {
    text = text.slice(0, Math.floor(text.length * 0.8));
    url = build(deputy, text, fetchedAt);
  }
  return url;
}

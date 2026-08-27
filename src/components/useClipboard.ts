import { useCallback, useEffect, useState } from "react";

/**
 * Copie dans le presse-papiers, avec confirmation éphémère.
 *
 * L'API exige un contexte sécurisé et peut être refusée : l'appel peut donc échouer
 * sans que ce soit un bug. Les composants qui s'en servent laissent toujours le
 * texte visible et sélectionnable en repli.
 */
export function useClipboard(resetAfterMs = 3000) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), resetAfterMs);
    return () => clearTimeout(timer);
  }, [copied, resetAfterMs]);

  const copy = useCallback((text: string) => {
    void navigator.clipboard
      .writeText(text)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }, []);

  return { copied, copy };
}

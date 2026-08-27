/**
 * Configuration ESLint (format « flat »).
 *
 * On reste volontairement proche des recommandations officielles : l'objectif est
 * d'attraper des bugs (dépendances de hooks oubliées, promesses non attendues,
 * variables mortes), pas d'imposer un style. Le formatage n'est pas vérifié — ajouter
 * Prettier réécrirait tous les fichiers sans rien corriger de fonctionnel.
 */
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },

  // --- Code applicatif : typage complet, règles les plus strictes -------------
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Un `_` en préfixe signale une variable délibérément inutilisée.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // `any` est interdit par le CLAUDE.md §11 : on en fait une erreur, pas un avis.
      "@typescript-eslint/no-explicit-any": "error",
      // Une promesse oubliée dans un handler avale silencieusement les erreurs.
      "@typescript-eslint/no-floating-promises": "error",
    },
  },

  // --- Scripts et données : exécutés par tsx sous Node, pas dans le navigateur -
  {
    files: ["scripts/**/*.ts", "data/**/*.ts", "*.config.{ts,js}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "off", // ces scripts communiquent par la sortie standard
    },
  },

  // En dernier : neutralise les règles ESLint qui entreraient en conflit avec
  // Prettier. Le formatage est l'affaire de Prettier, la correction celle d'ESLint.
  prettierConfig,
);

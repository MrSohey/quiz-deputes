// `vitest/config` et non `vite` : c'est lui qui connaît la clé `test`.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// `base` doit correspondre au nom du dépôt GitHub, sinon les assets sont en 404
// une fois publiés. Voir CLAUDE.md §11 : rien n'est publié pour l'instant.
const REPOSITORY_NAME = "quiz-deputes";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${REPOSITORY_NAME}/` : "/",
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

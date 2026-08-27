/**
 * Schéma de validation de `deputies.json`. Voir CLAUDE.md §4.3.
 *
 * Contrairement à quiz-ministres, ce fichier n'est PAS édité à la main : il est
 * régénéré par `npm run fetch`. Le schéma ne protège donc pas d'une faute de frappe
 * humaine mais d'une dérive de la source — colonne renommée, groupe inconnu,
 * circonscription vide. Il fait échouer le build.
 */
import { z } from "zod";
import { DIFFICULTIES, GROUP_IDS } from "../src/game/types";

export const deputySchema = z.object({
  // L'identifiant vient de l'Assemblée et sert à construire l'URL du portrait :
  // un identifiant non numérique produirait un lien mort.
  id: z.string().regex(/^\d+$/, "identifiant Assemblée nationale, numérique"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  group: z.enum(GROUP_IDS),
  department: z.string().min(1),
  // 1 à 21 : la plus grande circonscription est la 21e du Nord.
  constituency: z.number().int().min(1).max(30),
  profession: z.string().min(1).nullable(),
  // La difficulté décide de l'appartenance aux niveaux : une valeur absente
  // sortirait silencieusement quelqu'un du vivier.
  difficulty: z.union([
    z.literal(DIFFICULTIES[0]),
    z.literal(DIFFICULTIES[1]),
    z.literal(DIFFICULTIES[2]),
  ]),
  sourceUrl: z.string().url(),
});

export const deputiesFileSchema = z
  .object({
    fetchedAt: z.string().datetime(),
    deputies: z.array(deputySchema).min(1),
  })
  .refine((f) => new Set(f.deputies.map((d) => d.id)).size === f.deputies.length, {
    message: "les identifiants doivent être uniques",
  });

export type ValidatedDeputy = z.infer<typeof deputySchema>;

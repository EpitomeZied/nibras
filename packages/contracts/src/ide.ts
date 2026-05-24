import { z } from 'zod';

export const IdeLanguageSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

export const IdeLanguagesResponseSchema = z.object({
  languages: z.array(IdeLanguageSchema),
});

export const IdeStatusResponseSchema = z.object({
  configured: z.boolean(),
  reachable: z.boolean(),
});

export const IdeRunRequestSchema = z.object({
  sourceCode: z.string().max(65536),
  languageId: z.number().int().positive(),
  stdin: z.string().max(16384).optional(),
});

export const IdeRunStatusSchema = z.object({
  id: z.number().int(),
  description: z.string(),
});

export const IdeRunResponseSchema = z.object({
  status: IdeRunStatusSchema,
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  compileOutput: z.string().nullable(),
  time: z.string().nullable(),
  memory: z.number().nullable(),
  message: z.string().nullable(),
});

export type IdeLanguage = z.infer<typeof IdeLanguageSchema>;
export type IdeLanguagesResponse = z.infer<typeof IdeLanguagesResponseSchema>;
export type IdeStatusResponse = z.infer<typeof IdeStatusResponseSchema>;
export type IdeRunRequest = z.infer<typeof IdeRunRequestSchema>;
export type IdeRunResponse = z.infer<typeof IdeRunResponseSchema>;

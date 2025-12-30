import { z } from "zod";

export const CelebritySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  wikipediaPageId: z.string().optional(),
  image: z.string().url().optional(),
  bio: z.string().optional(),
  vapesVotes: z.number().int().min(0).default(0),
  doesNotVapeVotes: z.number().int().min(0).default(0),
  elo: z.number().int().min(0).default(1000),
  wins: z.number().int().min(0).default(0),
  matches: z.number().int().min(0).default(0),
  confirmedVaper: z.boolean().default(false),
  confirmedVaperYesVotes: z.number().int().min(0).default(0),
  confirmedVaperNoVotes: z.number().int().min(0).default(0),
  approved: z.boolean().default(true),
  status: z.enum(["active", "retired"]).default("active"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Celebrity = z.infer<typeof CelebritySchema>;

export const CreateCelebrityInputSchema = z.object({
  name: z.string().min(1),
});

export type CreateCelebrityInput = z.infer<typeof CreateCelebrityInputSchema>;

export const UpdateCelebrityInputSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  vapesVotes: z.number().int().min(0).optional(),
  doesNotVapeVotes: z.number().int().min(0).optional(),
  elo: z.number().int().min(0).optional(),
  wins: z.number().int().min(0).optional(),
  matches: z.number().int().min(0).optional(),
  confirmedVaper: z.boolean().optional(),
  confirmedVaperYesVotes: z.number().int().min(0).optional(),
  confirmedVaperNoVotes: z.number().int().min(0).optional(),
  status: z.enum(["active", "retired"]).optional(),
});

export type UpdateCelebrityInput = z.infer<typeof UpdateCelebrityInputSchema>;

import { z } from "zod";

export const CelebritySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  wikipediaPageId: z.string().optional(),
  image: z.string().url().optional(),
  bio: z.string().optional(),
  vapesVotes: z.number().int().min(0).default(0),
  doesNotVapeVotes: z.number().int().min(0).default(0),
  elo: z.number().int().min(0).default(1000),
  wins: z.number().int().min(0).default(0),
  matches: z.number().int().min(0).default(0),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Celebrity = z.infer<typeof CelebritySchema>;

export const CreateCelebrityInputSchema = z.object({
  name: z.string().min(1),
});

export type CreateCelebrityInput = z.infer<typeof CreateCelebrityInputSchema>;

export const UpdateCelebrityInputSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).optional(),
  vapesVotes: z.number().int().min(0).optional(),
  doesNotVapeVotes: z.number().int().min(0).optional(),
  elo: z.number().int().min(0).optional(),
  wins: z.number().int().min(0).optional(),
  matches: z.number().int().min(0).optional(),
});

export type UpdateCelebrityInput = z.infer<typeof UpdateCelebrityInputSchema>;

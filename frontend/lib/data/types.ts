import { z } from "zod";

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "user"]),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

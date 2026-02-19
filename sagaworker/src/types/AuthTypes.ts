import { z } from "zod";

export const User = z.object({
    UserName: z.string().min(3).max(20),
    password: z.string().min(8),
})
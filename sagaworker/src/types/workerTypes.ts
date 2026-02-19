import type { Context } from "hono";


export type Env = {
    DB: D1Database
    BUCKET: R2Bucket
    JWT_SECRET: string
}

export type AppContext = Context<{ Bindings: Env }>;

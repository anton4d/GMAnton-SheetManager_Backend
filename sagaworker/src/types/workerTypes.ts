import type { Context } from "hono";


export type Env = {
    DB: D1Database
    BUCKET: R2Bucket
    JWT_SECRET: string
    GITHUB_TOKEN: string
    GITHUB_USERNAME: string
    GITHUB_TAG: string
}

export type AppContext = Context<{ Bindings: Env }>;

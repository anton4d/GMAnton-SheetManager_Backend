import { DateTime, Str, Num } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export type Env = {
    DB: D1Database
    BUCKET: R2Bucket
    JWT_SECRET: string
}

export type AppContext = Context<{ Bindings: Env }>;

export const Customers = z.object({
	CustomerID: Num(),
	CompanyName: Str(),
	ContactName: Str()
})

export class HttpError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

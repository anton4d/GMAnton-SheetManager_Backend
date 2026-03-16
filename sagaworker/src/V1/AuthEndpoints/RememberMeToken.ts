import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, HttpError, ErrorSchema } from "@Types";
import { sign } from 'hono/jwt';
import { setCookie } from 'hono/cookie'

export class RememberMeToken extends OpenAPIRoute {
    schema = {
        tags: ["Auth", "Post","V1"],
        summary: "Refresh access token using rememberMe token cookie",
        responses: {
            "200": {
                description: "Returns a new JWT access token",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            result: z.object({
                                Token: Str()
                            })
                        }),
                    },
                },
            },
            "401": {
                description: "Token error",
                content: {
                    "application/json": {
                        schema: ErrorSchema,
                    },
                },
            },
            "500": {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: ErrorSchema,
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        try {

            const cookieHeader = c.req.header('Cookie') ?? '';
            const rememberMeToken = cookieHeader
                .split(';')
                .map(c => c.trim())
                .find(c => c.startsWith('rememberMeToken='))
                ?.split('=')[1];

            if (!rememberMeToken) {
                throw new HttpError("No rememberMe token", 401);
            }

            const now = Math.floor(Date.now() / 1000);

 
            const { results } = await c.env.DB
                .prepare("SELECT * FROM rememberMeToken WHERE Token = ?")
                .bind(rememberMeToken)
                .run();

            if (results.length === 0) {
                throw new HttpError("Invalid rememberMe token", 401);
            }

            const tokenRow = results[0];

            if ((tokenRow.ExpiresAt as number) < now) {
 
                await c.env.DB
                    .prepare("DELETE FROM rememberMeToken WHERE Token = ?")
                    .bind(rememberMeToken)
                    .run();
                throw new HttpError("rememberMe token expired, please login again", 401);
            }

            const { results: userResults } = await c.env.DB
                .prepare("SELECT * FROM Users WHERE UserId = ?")
                .bind(tokenRow.UserId)
                .run();

            if (userResults.length === 0) {
                throw new HttpError("User not found", 401);
            }

            const user = userResults[0];

            const newRememberMeToken = crypto.randomUUID();
            const RememberMeTokenExpiry = now + 60 * 60 * 24 * 30;

            await c.env.DB
                .prepare("DELETE FROM RememberMeTokens WHERE Token = ?")
                .bind(rememberMeToken)
                .run();

            await c.env.DB
                .prepare("INSERT INTO RememberMeTokens (Token, UserId, ExpiresAt) VALUES (?, ?, ?)")
                .bind(newRememberMeToken, user.UserId, RememberMeTokenExpiry)
                .run();

            const accessToken = await sign(
                {
                    userId: user.UserId,
                    username: user.UserName,
                    exp: now + 60 * 60,
                    iat: now,
                    nbf: now,
                },
                c.env.JWT_SECRET,
            );

            setCookie(c, 'rememberMeToken', newRememberMeToken, {
                httpOnly: true,
                path: '/api/V1/Auth/RememberMeRefresh',
                maxAge: 2592000,
                sameSite: 'Lax',
            });

            return {
                result: { Token: accessToken },
                success: true,
            };
        } catch (e: unknown) {
            if (e instanceof HttpError) {
                return e.toResponse();
            }
            return Response.json(
                { success: false, errorMessage: "Internal Server Error" },
                { status: 500 }
            );
        }
    }
}
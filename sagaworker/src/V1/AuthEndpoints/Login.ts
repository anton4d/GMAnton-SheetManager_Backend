import {OpenAPIRoute, contentJson} from "chanfana";
import { z } from "zod";
import { type AppContext, HttpError,ZodErrorSchema, User, ErrorSchema } from "@Types";
import { compareSync } from "bcrypt-ts";
import { setCookie } from 'hono/cookie'
import { sign } from 'hono/jwt'

export class LoginUser extends OpenAPIRoute {
    schema = {
        tags: ["Auth", "Post","V1"],
        summary: "Login with a username and password",
        request: {
            body: contentJson(z.object({
                User,
                RememberMe: z.boolean(),
            })),
        },
        responses: {
            "200": {
                description: "Returns a JWT token if credentials are valid",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            result: z.object({
                                Token: z.string()
                            })
                        }),
                    },
                },
            },
            "400": {
                    description: "Validation error, e.g. username too short or password too short",
                    content: {
                        "application/json": {
                            schema: ZodErrorSchema,
                        },
                    },
                },
            "401": {
                description: "Invalid credentials",
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
        const data = await this.getValidatedData<typeof this.schema>();
        const { User, RememberMe } = data.body;
        const { UserName: username, password } = User
        try {
            const { results } = await c.env.DB
                .prepare("SELECT * FROM Users WHERE UserName = ?")
                .bind(username)
                .run();

            if (results.length === 0) {
                throw new HttpError("Invalid credentials", 401);
            }

            const user = results[0];

            if (!compareSync(password, user.UserPassword as string)) {
                throw new HttpError("Invalid credentials", 401);
            }

            const now = Math.floor(Date.now() / 1000);
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

            if (RememberMe){
                console.log("create rememberme Token")
                const rememberMeToken = crypto.randomUUID();
                const rememberMeExpiry = now + 60 * 60 * 24 * 30; 

                await c.env.DB
                    .prepare("INSERT INTO RememberMeTokens (rememberMeToken, UserId, ExpiresAt) VALUES (?, ?, ?)")
                    .bind(rememberMeToken, user.UserId, rememberMeExpiry)
                    .run();

                setCookie(c, 'rememberMeToken', rememberMeToken, {
                    httpOnly: true,
                    path: '/api/V1/Auth/RememberMeRefresh',
                    maxAge: 2592000,
                    sameSite: 'Lax',
                });
                console.log("Cookie header:", c.res.headers.get('Set-Cookie'));
            }
            

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
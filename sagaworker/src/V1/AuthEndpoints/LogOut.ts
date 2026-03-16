import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, HttpError, ZodErrorSchema, ErrorSchema } from "@Types";
import { deleteCookie } from 'hono/cookie'

export class LogoutUser extends OpenAPIRoute {
    schema = {
        tags: ["Auth", "get","V1"],
        summary: "Logout user and invalidate rememberMe token",
        responses: {
            "200": {
                description: "Returns if logout was successful",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
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


            await c.env.DB
                .prepare("DELETE FROM RememberMeTokens WHERE Token = ?")
                .bind(rememberMeToken)
                .run();

            deleteCookie(c, 'rememberMeToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                path: '/api/V1/Auth/RememberMeRefresh',
            });
            
            return { success: true };
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
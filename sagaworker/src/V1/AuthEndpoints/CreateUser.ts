import { OpenAPIRoute, contentJson } from "chanfana";
import { z } from "zod";
import { type AppContext, HttpError,ZodErrorSchema,ErrorSchema, User } from "@Types";
import { hashSync } from "bcrypt-ts";

export class CreateUser extends OpenAPIRoute {
    schema = {
        tags: ["Auth", "Post","V1"],
        summary: "Create a user with a username and password",
        request: {
            body: contentJson(z.object({
                User: User
            })),
        },
        responses: {
                "200": {
                    description: "User was created successfully",
                    content: {
                        "application/json": {
                            schema: z.object({
                                success: z.boolean(),
                                result: z.object({
                                    msg: z.string()
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
                "409": {
                    description: "Username already in use",
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
        const { User } = data.body;
        const { UserName: username, password } = User;

        const hashedPassword = hashSync(password, 10);

        try {
            const { results } = await c.env.DB
                .prepare("SELECT * FROM Users WHERE UserName = ?")
                .bind(username)
                .run();

            if (results.length > 0) {
                throw new HttpError("Username already in use", 409);
            }

            await c.env.DB
                .prepare("INSERT INTO Users (UserName, UserPassword) VALUES (?, ?)")
                .bind(username, hashedPassword)
                .run();

            return {
                result: { msg: "User was created" },
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
import { Bool, OpenAPIRoute, contentJson, Str} from "chanfana";
import { z } from "zod";
import { type AppContext, Customers, HttpError } from "../../types";
import { genSaltSync, hashSync,compareSync } from "bcrypt-ts";
import { decode, sign, verify } from 'hono/jwt'

export class LoginUser extends OpenAPIRoute {
	schema = {
		tags: ["V1/Auth","Post"],
		summary: "Login with a password and userName",
		request: {
            body: contentJson(z.object({
                UserName: z.string().min(3).max(20),
                password: z.string().min(8),
            })),
		},
		responses: {
			"200": {
				description: "Returns If A Token if login was successful",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
                                    Token: Str()
                                })
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
        const data = await this.getValidatedData<typeof this.schema>();
        const body = data.body
        const password = body.password
        const username = body.UserName
        try {
            let { results } = await c.env.DB.prepare(
                "SELECT * FROM Users WHERE UserName = ?"
            )
            .bind(username)
            .run();

            if (results.length === 0) {
                 throw new HttpError( "Invalid credentials" , 401)
            }

            let user = results[0]
            if (!compareSync(password, user.UserPassword as string)) {
                throw new HttpError( "Invalid credentials" , 401)
            }
            const now = Math.floor(Date.now() / 1000)
            const token = await sign(
            {
                userId: user.UserId,
                username: user.UserName,
                exp: now + 60 * 60,  
                iat: now,            
                nbf: now             
            },
            c.env.JWT_SECRET,
            )
            return {
			    result: { Token: token
			    },
			    success: true,
		    };
        }
        catch (e: unknown) {
			if (e instanceof HttpError) {
				return Response.json(
					{
						success: false,
						errorMessage: e.message,
					},
					{ status: e.statusCode }
				);
			}

			return Response.json(
				{	
					success: false,
					errorMessage: "Internal Server Error",
				},
				{ status: 500 }
			);
		}
    }
}


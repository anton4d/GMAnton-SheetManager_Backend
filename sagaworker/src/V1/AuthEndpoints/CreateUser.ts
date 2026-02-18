import { Bool, OpenAPIRoute, contentJson, Str} from "chanfana";
import { z } from "zod";
import { type AppContext, Customers, HttpError } from "../../types";
import { genSaltSync, hashSync,compareSync } from "bcrypt-ts";

export class CreateUser extends OpenAPIRoute {
	schema = {
		tags: ["V1/Auth","Post"],
		summary: "Create a user with a password and userName",
		request: {
            body: contentJson(z.object({
                UserName: z.string().min(3).max(20),
                password: z.string().min(8),
            })),
		},
		responses: {
			"200": {
				description: "Returns If A user was created",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
                                    msg: Str()
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
        console.log(body)
        const salt = genSaltSync(10);
        const result = hashSync(password, salt);
        try {
            let { results } = await c.env.DB.prepare(
                "SELECT * FROM Users WHERE UserName = ?"
            )
            .bind(username)
            .run();
            if(results.length > 0){
                throw new HttpError("Username already in use", 404);
            }

            await c.env.DB.prepare(
            "insert into Users (UserName, UserPassword) values (?, ?)"
            )
            .bind(username,result)
            .run()
            return {
			    result: { msg:"User was Created"
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


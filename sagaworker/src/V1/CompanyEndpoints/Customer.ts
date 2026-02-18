import { Bool, OpenAPIRoute, Str } from "chanfana";
import { z } from "zod";
import { type AppContext, Customers,HttpError } from "../../types";

export class Customer extends OpenAPIRoute {
	schema = {
		tags: ["V1/Company","get"],
		summary: "Get customeres from the company beverages",
		request: {
			params: z.object({
				CompanyName: Str({ description: "A company Name" }),
			}),
		},
		responses: {
			"200": {
				description: "Returns A list of costumers based on company name",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: Customers.array()
							}),
						}),
					},
				},
			},
			"404": {
				description: "",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								errorMessage: Str()
							}),
						}),
					},
				},
			},
			"500": {
				description: "",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								errorMessage: Str()
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();

		const { CompanyName } = data.params;
		try{
			const { results } = await c.env.DB
			.prepare("SELECT * FROM Customers WHERE CompanyName = ?")
			.bind(CompanyName)
			.run();

			if(results.length === 0){
				throw new HttpError("No Company with this name", 404);
			}

			return {
			result: { results
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

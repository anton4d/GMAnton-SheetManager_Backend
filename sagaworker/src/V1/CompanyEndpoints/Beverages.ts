import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Customers } from "@Types";

export class Beverages extends OpenAPIRoute {
	schema = {
		tags: ["V1/Company","get"],
		summary: "Get customeres from the company beverages",
		request: {
		},
		responses: {
			"200": {
				description: "Returns If beverages can be found",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: z.boolean(),
								result: Customers.array()
							}),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		// Get validated data
		const data = await this.getValidatedData<typeof this.schema>();

		const { results } = await c.env.DB
        .prepare("SELECT * FROM Customers WHERE CompanyName = ?")
        .bind("Bs Beverages")
        .run();

		return {
			result: { results
			},
			success: true,
		};
	}
}

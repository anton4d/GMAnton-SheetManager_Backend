import { z } from "zod";


export const Customers = z.object({
	CustomerID: z.number(),
	CompanyName: z.string(),
	ContactName: z.string()
})

export class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }

    toResponse() {
        return Response.json(
            { success: false, errorMessage: this.message },
            { status: this.statusCode }
        );
    }
}

export const ZodErrorSchema = z.object({
    success: z.boolean(),
    result: z.object({}),
    errors: z.array(z.object({
        code: z.string(),
        message: z.string(),
        path: z.array(z.string()),
        minimum: z.number().optional(),
        maximum: z.number().optional(),
        type: z.string().optional(),
        inclusive: z.boolean().optional(),
        exact: z.boolean().optional(),
    })),
});

export const ErrorSchema = z.object({
    success: z.boolean(),
    errorMessage: z.string(),
});

import { Hono } from "hono"
import { fromHono } from "chanfana"
import { Env } from "./types";
import V1Api from "./V1/V1Api"


const app = new Hono<{ Bindings: Env }>()

const openapi = fromHono(app, {
    schema: {
        info: {
            title: 'My Awesome API',
            version: '2.0.0',
            description: 'This is the documentation for my awesome API.',
            termsOfService: 'https://example.com/terms/',
            contact: {
                name: 'API Support',
                url: 'https://example.com/support',
                email: 'support@example.com',
            },
            license: {
                name: 'Apache 2.0',
                url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
            },
        },
        servers: [
            { url: 'https://api.example.com', description: 'Production server' },
            { url: 'http://localhost:8787', description: 'Development server' },
        ],
        tags: [
            { name: 'User', description: 'Operations related to users' },
            { name: 'Gm', description: 'Operations related to Gm' },
        ],
    },
    docs_url: '/docs',
    redoc_url: '/redocs',
    openapi_url: '/openapi.json',
    openapiVersion: '3.1',
    generateOperationIds: true,
    raiseUnknownParameters: false,
});

const BasePath = fromHono(new Hono())
BasePath.route("/V1",V1Api)// import the v1 api router index 


openapi.route("/api",BasePath)// import the basepath of /api

export default app

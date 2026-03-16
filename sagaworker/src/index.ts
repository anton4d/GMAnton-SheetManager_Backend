import { Hono } from "hono"
import { cors } from 'hono/cors'
import { fromHono } from "chanfana"

import { Env } from "@Types";
import V1Api from "./V1/V1Api"


const app = new Hono<{ Bindings: Env }>()
app.use('*', cors({
  origin: ['http://localhost:4200', 'https://antonlschristensen.com/'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))
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
            { url: 'http://localhost:8787', description: 'Development server' },
        ],
        tags: [
            { name: 'Player', description: 'Operations related to Player' },
            { name: 'Gm', description: 'Operations related to Gm' },
            { name: 'Auth', description: 'Operations related to authentication' },
            { name: 'V1', description: 'Version 1 api endpoints' },
            { name: 'get', description: 'get Operations' },
            { name: 'Post', description: 'Post Operations' },
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

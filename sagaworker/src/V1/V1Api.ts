import { Hono } from "hono"
import { fromHono } from "chanfana"
import { Env } from "../types";
import companyRouter from "./CompanyEndpoints/CompanyRouter"

const app = new Hono<{ Bindings: Env }>()

const V1Api = fromHono(app, {
  	docs_url: "/docs",
})


V1Api.route("/Company",companyRouter)

export default V1Api
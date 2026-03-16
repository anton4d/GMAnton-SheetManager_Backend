import { Hono } from "hono"
import { fromHono } from "chanfana"
import { Env } from "@Types"
import { jwt } from "hono/jwt"

import companyRouter from "./CompanyEndpoints/CompanyRouter"
import AuthRouter from "./AuthEndpoints/AuthRouter"
import PortFolioRouters from "./Portfolio/PortFolioRouters"

const app = new Hono<{ Bindings: Env }>()

app.use("/*/Vault/*", (c, next) => {
  return jwt({
    secret: c.env.JWT_SECRET,
    alg: "HS256",
  })(c, next)
})

const V1Api = fromHono(app, {
  docs_url: "/docs",
})

V1Api.route("/Company", companyRouter)
V1Api.route("/Auth",AuthRouter)
V1Api.route("/PortFolio",PortFolioRouters)

export default V1Api

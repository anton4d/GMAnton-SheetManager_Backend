import { Hono } from "hono"
import { fromHono } from "chanfana"
import { Env } from "../types"
import { jwt } from "hono/jwt"

import companyRouter from "./CompanyEndpoints/CompanyRouter"
import AuthRouter from "./AuthEndpoints/AuthRouter"

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

export default V1Api

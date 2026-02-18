import { Hono } from "hono"
import { fromHono } from "chanfana"
import { CreateUser } from "./CreateUser"
import { LoginUser } from "./Login"
const AuthRouter = fromHono(new Hono())

AuthRouter.post("/CreateUser",CreateUser)
AuthRouter.post("/Login",LoginUser)

export default AuthRouter
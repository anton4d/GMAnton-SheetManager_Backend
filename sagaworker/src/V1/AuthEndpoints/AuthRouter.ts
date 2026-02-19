import { Hono } from "hono"
import { fromHono } from "chanfana"

import { CreateUser } from "./CreateUser"
import { LoginUser } from "./Login"
import {RememberMeToken} from "./RememberMeToken"
import {LogoutUser} from "./LogOut"

const AuthRouter = fromHono(new Hono())

AuthRouter.post("/CreateUser",CreateUser)
AuthRouter.post("/Login",LoginUser)
AuthRouter.post("/RememberMeRefresh",RememberMeToken)
AuthRouter.post("/LogOut",LogoutUser)

export default AuthRouter
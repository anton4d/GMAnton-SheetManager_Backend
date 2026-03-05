import { Hono } from "hono"
import { fromHono } from "chanfana"
import {GithubTaggedRepos} from "./Repos"

const PortFolioRouters = fromHono(new Hono())

PortFolioRouters.get("/repos", GithubTaggedRepos)

export default PortFolioRouters
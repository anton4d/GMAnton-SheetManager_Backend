import { Hono } from "hono"
import { fromHono } from "chanfana"
import { Beverages } from "./Beverages";
import {Customer} from "./Customer";

const companyRouter = fromHono(new Hono())

companyRouter.get("/beverages", Beverages)
companyRouter.get("/Costumers/:CompanyName", Customer)

export default companyRouter
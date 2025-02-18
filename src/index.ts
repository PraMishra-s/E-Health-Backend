import "dotenv/config"
import express, { NextFunction } from 'express'
import cookieParser from "cookie-parser"
import cors from "cors"
import { config } from "./config/app.config"
import { Request, Response } from "express"
import { asyncHandler } from "./middlewares/asyncHandler"
import { errorHandler } from "./middlewares/errorHandler"
import { HTTPSTATUS } from "./config/http.config"
import helmet from "helmet";
import compression from "compression"
import morgan from "morgan";
import authRoutes from "./modules/auth/auth.route"
import passport from "./middlewares/passport"
import { authenticateJWT } from "./common/strageties/jwt.strategy"
import sessionRoutes from "./modules/session/session.route"
import mfaRoutes from "./modules/mfa/mfa.routes"
import userRoutes from "./modules/user/user.route"
import haRoutes from "./modules/ha/ha.route"
import "./common/scheduler/endLeaveScheduler"
import "./common/scheduler/haScheduler"





const app = express()
const BASE_PATH = config.BASE_PATH


app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: config.APP_ORIGIN,
    credentials: true
}))
app.use(helmet())
app.use(cookieParser())
app.use(passport.initialize())
app.use(compression())
app.use(morgan("combined"));



app.get(
    "/",
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        res.status(HTTPSTATUS.OK).json({
            message: "BasePoint",
        });
    })
)
app.use(`${BASE_PATH}/auth`, authRoutes)
app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoutes)
app.use(`${BASE_PATH}/mfa`, mfaRoutes)
app.use(`${BASE_PATH}/user`, userRoutes)
app.use(`${BASE_PATH}/ha`, haRoutes)

app.use(errorHandler)

app.listen(config.PORT,async () => {
    console.log(`Server is running on port ${config.PORT}`);
});
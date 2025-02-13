import "dotenv/config"
import express, { NextFunction } from 'express'
import cookieParser from "cookie-parser"
import cors from "cors"
import { config } from "./config/app.config"
import { Request, Response } from "express"
import passport from "passport"
import { asyncHandler } from "./middlewares/asyncHandler"
import { errorHandler } from "./middlewares/errorHandler"
import { HTTPSTATUS } from "./config/http.config"
import helmet from "helmet";
import compression from "compression"
import morgan from "morgan";



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
// app.use(passport.initialize())
app.use(compression())



app.get(
    "/",
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        res.status(HTTPSTATUS.OK).json({
            message: "BasePoint",
        });
    })
)

app.use(errorHandler)

app.listen(config.PORT,async () => {
    console.log(`Server is running on port ${config.PORT}`);
    // await connectDatabase();
});
import { ErrorRequestHandler } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../common/utils/AppError";
import { z } from "zod"
import { Response } from "express";
import { clearAuthenticationCookies, REFRESH_PATH } from "../common/utils/cookies";


const formatZodError = (res: Response, error: z.ZodError) =>{
    const errors  = error?.issues?.map((err)=>({
        field: err.path.join("."),
        message: err.message
    }))
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Validation failed",
        errors: errors
    })
}

export const errorHandler:ErrorRequestHandler = (error, req, res, next):any =>{
    console.error(`Error occured at path: ${req.path}`, error)

    if(req.path === REFRESH_PATH){
        clearAuthenticationCookies(res)
    }    
    if(error instanceof SyntaxError){
        return res.status(HTTPSTATUS.BAD_GATEWAY).json({
            message: "Invalid Json format, please check your request body"
        })
    }
    if(error instanceof z.ZodError){
        return formatZodError(res, error)
    }
    if(error instanceof AppError){
        return res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode
        })
    }
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error?.message || "Unknown error occured"
    })
}
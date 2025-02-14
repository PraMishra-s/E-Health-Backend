import { registrationSchema } from "../../common/validators/auth.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { AuthService} from "./auth.service";
import { Request, Response } from "express";

export class AuthController{
    private authService: AuthService;

    constructor(authService: AuthService){
        this.authService = authService
    }

    public register = asyncHandler(async (req: Request, res: Response): Promise<any> => {
        const body = registrationSchema.parse({
            ...req.body
        })
        const { user } = await this.authService.register(body)
        return res.status(HTTPSTATUS.CREATED).json({
            message: "User registered successfully",
            data: user
        })
    })
}
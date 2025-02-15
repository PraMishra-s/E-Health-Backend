import { NotFoundException } from "../../common/utils/catch-errors";
import { clearAuthenticationCookies, setAuthenticationCookies } from "../../common/utils/cookies";
import { loginSchema, registrationSchema, verificationEmailSchema } from "../../common/validators/auth.validator";
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
    public login = asyncHandler(async(req: Request, res: Response): Promise<any> => {
        const userAgent = req.headers["user-agent"];
        const body = loginSchema.parse({
            ...req.body,
            userAgent
        })
        const {user, accessToken, refreshToken} = await this.authService.login(body);

        return setAuthenticationCookies({
            res, accessToken, refreshToken
        }).status(HTTPSTATUS.OK).json({
            message: "User logged in Successfully",
            user,
        })
    })
     public verifyEmail = asyncHandler(
        async (req: Request, res: Response):Promise<any> =>{
            const { code } = verificationEmailSchema.parse(req.body)
            await this.authService.verifyEmail(code)
            return res.status(HTTPSTATUS.OK).json({
                message: "Email verified successfully"
            })
        }
    );
     public logout = asyncHandler(
        async (req: Request, res: Response):Promise<any> =>{
            const sessionId = req.sessionId
            if(!sessionId){
                throw new NotFoundException("Session Invalid")
            }
            await this.authService.logout(sessionId)

            return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
                message: `User logout successfully.`,
                
            })
        }
    )
}
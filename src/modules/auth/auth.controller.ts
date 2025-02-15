import { NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { clearAuthenticationCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthenticationCookies } from "../../common/utils/cookies";
import { emailSchema, loginSchema, registrationSchema, resetPasswordSchema, verificationEmailSchema } from "../../common/validators/auth.validator";
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
    public forgotPassword = asyncHandler(
    async (req: Request, res: Response):Promise<any> =>{
        const email = emailSchema.parse(req.body.email)
        await this.authService.forgotPassword(email)
        return res.status(HTTPSTATUS.OK).json({
            message: "Password reset Email send"
        })
    }
    );
    public resetPassword = asyncHandler(
        async (req: Request, res: Response):Promise<any> =>{
            const body = resetPasswordSchema.parse(req.body)
            await this.authService.resetPassword(body);
            return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
                message: "Reset Password Successfully"
            })
        }
    );
    public refreshToken = asyncHandler(
        async (req: Request, res: Response):Promise<any> =>{
            const refreshToken = req.cookies.refreshToken as string | undefined
            if(!refreshToken){
                throw new UnauthorizedException("Missing refresh Token")
            }
            const { accessToken, newRefreshToken } = await this.authService.refreshToken(refreshToken)

            if (newRefreshToken){
                res.cookie(
                    "refreshToken",
                    newRefreshToken,
                    getRefreshTokenCookieOptions()
                )
            }
            return res
            .status(HTTPSTATUS.OK)
            .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
            .json({
                    message: "Refresh access token successful"
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
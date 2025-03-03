import { User } from "../../common/@types";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { setAuthenticationCookies } from "../../common/utils/cookies";
import { verifyMFAForLoginSchema } from "../../common/validators/mfa.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { MFAService } from "./mfa.service";
import { Request, Response } from "express";


export class MFAController{
    private mfaService
    constructor(mfaService: MFAService ){
        this.mfaService = mfaService
    }
    public invokeMFASetup = asyncHandler(async (req: Request, res: Response): Promise<any> => {
        const userId = (req.user as User)?.id;
        const sessionId = req?.sessionId!;
        
        if (!userId) {
            throw new UnauthorizedException("Session not found. Please log in.");
        }
        

       const user =  await this.mfaService.invokeMFASetup(userId, sessionId);
        
        return res.status(HTTPSTATUS.CREATED).json({
            message: "MFA has been enabled successfully.",
            user
        });
    });

    public verifyMFAForLogin = asyncHandler(async (req: Request, res: Response) => {
        const { email, code, userAgent } = verifyMFAForLoginSchema.parse({
            ...req.body,
            userAgent: req.headers['user-agent'] 
        });

        const { user, accessToken, refreshToken } = await this.mfaService.verifyMFAForLogin(code, email, userAgent);

        return setAuthenticationCookies({ res, accessToken, refreshToken })
            .status(HTTPSTATUS.OK)
            .json({
                message: "Verified & logged in successfully",
                user
            });
    });

    public revokeMFA = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const sessionId = req?.sessionId!;

        if (!userId) {
            throw new UnauthorizedException("Session ID not found. Please log in.");
        }

        await this.mfaService.revokeMFA(userId, sessionId);

        return res.status(HTTPSTATUS.OK).json({
            message: "MFA successfully disabled.",
        });
    });






}
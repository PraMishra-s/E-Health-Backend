import { z } from "zod";
import { NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { SessionService } from "./session.service";
import { Request, Response } from "express";
import { clearAuthenticationCookies } from "../../common/utils/cookies";
import { User } from "../../common/@types";
import { ErrorCode } from "../../common/enums/error-code.enum";

export class SessionController {
    private sessionService: SessionService;

    constructor(sessionService: SessionService) {
        this.sessionService = sessionService;
    }

    // 🔹 Fetch all sessions for the authenticated user
    public getAllSession = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const currentSessionId = req.sessionId;

        if (!currentSessionId) {
            throw new UnauthorizedException(
                "Session ID not found. Please log in.",
                ErrorCode.ACCESS_UNAUTHORIZED
            );
        }

        const sessions = await this.sessionService.getAllSessionsBySessionId(userId, currentSessionId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Retrieved all sessions successfully",
            sessions,
        });
    });

    public getSession = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = req.sessionId;

        if (!sessionId) {
            throw new NotFoundException(
                "Session ID not Found. Please Log in",
                ErrorCode.ACCESS_UNAUTHORIZED
            );
        }

        const { user } = await this.sessionService.getSessionById(sessionId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Session retrieved Successfully",
            user
        });
    });

    public deleteSession = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = z.string().parse(req.params.id);
        const userId = (req.user as User)?.id;
        const currentSessionId = req.sessionId
  

        if (!userId) {
            throw new UnauthorizedException(
                "Session not found.",
                ErrorCode.ACCESS_UNAUTHORIZED
            );
        }

        await this.sessionService.deleteSession(sessionId, userId);

        if(sessionId === currentSessionId){
            return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
                message: `Session removed successfully and User logout.`,
        })
        }

        return res.status(HTTPSTATUS.OK).json({
            message: "Session removed successfully",
        });
    });

   public deleteAllSessions = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const userId = (req.user as User)?.id;;
    if (!userId) {
      throw new UnauthorizedException(
        "Session not found. Please log in.",
        ErrorCode.ACCESS_UNAUTHORIZED
    );
    }

    const response = await this.sessionService.deleteAllSessions(userId);
     return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
                message: `All Session removed successfully and user logged out.`,
        })
    
  });

}

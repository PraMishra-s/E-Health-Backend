import { z } from "zod";
import { NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { SessionService } from "./session.service";
import { Request, Response } from "express";

export class SessionController {
    private sessionService: SessionService;

    constructor(sessionService: SessionService) {
        this.sessionService = sessionService;
    }

    // 🔹 Fetch all sessions for the authenticated user
    public getAllSession = asyncHandler(async (req: Request, res: Response) => {
        const currentSessionId = req.sessionId;

        if (!currentSessionId) {
            throw new UnauthorizedException("Session ID not found. Please log in.");
        }

        const sessions = await this.sessionService.getAllSessionsBySessionId(currentSessionId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Retrieved all sessions successfully",
            sessions,
        });
    });

    public getSession = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = req.sessionId;

        if (!sessionId) {
            throw new NotFoundException("Session ID not Found. Please Log in");
        }

        const { user } = await this.sessionService.getSessionById(sessionId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Session retrieved Successfully",
            user
        });
    });

    public deleteSession = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = z.string().parse(req.params.id);
        const currentSessionId = req.sessionId;

        if (!currentSessionId) {
            throw new UnauthorizedException("Session not found.");
        }

        await this.sessionService.deleteSession(sessionId, currentSessionId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Session removed successfully",
        });
    });
}

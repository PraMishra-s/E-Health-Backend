import { User } from "../../common/@types";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { changeSecretWordSchema, changeStatusSchema, fogotPasswordSchema, setLeaveSchema } from "../../common/validators/ha.validator";
import { uuidSchema } from "../../common/validators/inventory.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { HaService } from "./ha.service";
import { Request, Response } from "express";

export class HaController{
    private haService

    constructor(haService: HaService){
        this.haService = haService
    }

    public forgotPassword = asyncHandler(async (req: Request, res: Response) =>{
        const { email, secret_word } = fogotPasswordSchema.parse(req.body)
        const response = this.haService.forgotPassword(email, secret_word)
        return res.status(HTTPSTATUS.OK).json({
            message: "Password reset Email send"
        })

    });
    public changeSecretWord = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType
        if (!userId || userType !== "HA") {
            throw new UnauthorizedException(
                "Unauthorized access.",
                ErrorCode.ACCESS_FORBIDDEN
            );
        }

        const { currentSecret, newSecret } = changeSecretWordSchema.parse(req.body);

        await this.haService.changeSecretWord(userId, currentSecret, newSecret);

        return res.status(HTTPSTATUS.OK).json({
            message: "Secret changed successfully.",
        });
    });
    public toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType; 

        if (!userId || userType !== "HA") {
            throw new UnauthorizedException("Unauthorized access", ErrorCode.ACCESS_FORBIDDEN);
        }

        const newStatus = await this.haService.toggleAvailability(userId);

        return res.status(HTTPSTATUS.OK).json({
            message: `Availability updated successfully.`,
            is_available: newStatus,
        });
    });
    public setLeave = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;

        if (!userId || userType !== "HA") {
            throw new UnauthorizedException(
                "Unauthorized access.",
                ErrorCode.ACCESS_FORBIDDEN
            );
        }

        // Validate input
        const { start_date, end_date, reason } = setLeaveSchema.parse(req.body);

        await this.haService.setLeave(userId, start_date, end_date, reason);

        return res.status(HTTPSTATUS.OK).json({
            message: "Leave details set successfully.",
        });
    });
    public cancelLeave = asyncHandler(async (req: Request, res: Response) => {

        const userId = (req.user as any)?.id; 
        const userType = (req.user as any)?.userType; 

        if (!userId || userType !== "HA") {
        throw new UnauthorizedException("Unauthorized access.",
             ErrorCode.ACCESS_FORBIDDEN
        )
        }

        await this.haService.cancelLeave(userId);

        return res.status(HTTPSTATUS.OK).json({
        message: "Leave cancelled successfully; HA is now available."
        });
    });
    public getLeave = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as any)?.id;
        const userType = (req.user as any)?.userType;

        if (!userId || userType !== "HA") {
            throw new UnauthorizedException("Unauthorized access.", ErrorCode.ACCESS_FORBIDDEN);
        }

        const leaveDetails = await this.haService.getLeave(userId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Leave details fetched successfully.",
            leaveDetails,
        });
    })
    public getHaDetails = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as any)?.id; 
        const userType = (req.user as any)?.userType; 

        if (!userId || userType !== "HA" && userType !== "DEAN") {
            throw new UnauthorizedException("Unauthorized access.", ErrorCode.ACCESS_FORBIDDEN);
        }

        const haDetails = await this.haService.getHaDetails();

        return res.status(HTTPSTATUS.OK).json({
            message: "HA details fetched successfully.",
            haDetails,
        });
    })
    public changeStatus = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as any)?.id; 
        const userType = (req.user as any)?.userType; 
        const id = uuidSchema.parse(req.params.id);

        if (!userId || userType !== "HA" && userType !== "DEAN") {
            throw new UnauthorizedException("Unauthorized access.", ErrorCode.ACCESS_FORBIDDEN);
        }
        const { status } = changeStatusSchema.parse(req.body);

        await this.haService.changeStatus(id, status);

        return res.status(HTTPSTATUS.OK).json({
            message: "HA status updated successfully.",
        });
    })

}
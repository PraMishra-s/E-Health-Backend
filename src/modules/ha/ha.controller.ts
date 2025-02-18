import { User } from "../../common/@types";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { changeSecretWordSchema, fogotPasswordSchema } from "../../common/validators/ha.validator";
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

    })
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
}
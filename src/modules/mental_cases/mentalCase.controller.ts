import { User } from "../../common/@types";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { uuidSchema } from "../../common/validators/inventory.validator";
import { updateMentalHealthCaseSchema } from "../../common/validators/mentalCases.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { MentalService } from "./mentalCase.service";
import { Request, Response } from "express";

export class MentalController{
    private mentalService
    constructor(mentalService: MentalService){
        this.mentalService = mentalService
    }

    public getAllCases = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;
        if (!userId || userType !== "HA" && userType !== "DEAN") {
            throw new UnauthorizedException(
                "Unauthorized access.",
                ErrorCode.ACCESS_FORBIDDEN
            );
        }
        const cases = await this.mentalService.getAllCases();
        res.status(HTTPSTATUS.OK).json({ message: 'Cases retrieved successfully', cases });
    });

    public updateCase = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;
        if (!userId || userType !== "HA" && userType !== 'DEAN') {
            throw new UnauthorizedException(
                "Unauthorized access.",
                ErrorCode.ACCESS_FORBIDDEN
            );
        }
        const id = uuidSchema.parse(req.params.id);
        const data = updateMentalHealthCaseSchema.parse(req.body);
        const updatedCase = await this.mentalService.updateCase(id, data);
        res.status(HTTPSTATUS.OK).json({ message: 'Mental health case updated successfully', updatedCase });
    });
}
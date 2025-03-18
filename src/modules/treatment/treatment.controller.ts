import { User } from "../../common/@types";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { uuidSchema } from "../../common/validators/inventory.validator";
import { createTreatmentSchema, updateTreatmentSchema } from "../../common/validators/treatment.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { TreatmentService } from "./treatment.service";
import { Request, Response } from "express";

export class TreatmentController{
    private treatmentService
    constructor(treatmentService: TreatmentService){
        this.treatmentService = treatmentService
    }
    public addTreatment = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;

        if (!userId || userType !== "HA") {
            throw new UnauthorizedException(
                "Unauthorized access.",
                ErrorCode.ACCESS_FORBIDDEN
            );
        }
        const validatedData = createTreatmentSchema.parse(req.body);
        const treatment = await this.treatmentService.addTreatment(userId, validatedData);

        return res.status(HTTPSTATUS.OK).json({ message: "Treatment record created.", treatment });
    });

    // ✅ Update Treatment
    public updateTreatment = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;

        if (!userId || userType !== "HA") {
            throw new UnauthorizedException(
                "Unauthorized access.",
                ErrorCode.ACCESS_FORBIDDEN
            );
        }
        const treatmentId = uuidSchema.parse(req.params.id);
        const validatedData = updateTreatmentSchema.parse(req.body);
        const updatedTreatment = await this.treatmentService.updateTreatment(treatmentId, validatedData);

        return res.status(HTTPSTATUS.OK).json({ message: "Treatment updated.", updatedTreatment });
    });

    // ✅ Get all treatments for a patient
    public getPatientTreatments = asyncHandler(async (req: Request, res: Response) => {
        const patientId = uuidSchema.parse(req.params.id);
        const treatments = await this.treatmentService.getPatientTreatments(patientId);

        return res.status(HTTPSTATUS.OK).json({ treatments });
    });

    // ✅ Get single treatment details
    public getTreatmentById = asyncHandler(async (req: Request, res: Response) => {
        const treatmentId = uuidSchema.parse(req.params.id);
        const treatment = await this.treatmentService.getTreatmentById(treatmentId);

        return res.status(HTTPSTATUS.OK).json({ treatment });
    });

    // ✅ Delete Treatment
    public deleteTreatment = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;

        if (!userId || userType !== "HA") {
            throw new UnauthorizedException(
                "Unauthorized access.",
                ErrorCode.ACCESS_FORBIDDEN
            );
        }
        const treatmentId = uuidSchema.parse(req.params.id);
        await this.treatmentService.deleteTreatment(treatmentId);

        return res.status(HTTPSTATUS.OK).json({ message: "Treatment deleted successfully." });
    });
}
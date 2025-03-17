import { illnessSchema, updateIllnessSchema } from "../../common/validators/illness.validator";
import { uuidSchema } from "../../common/validators/inventory.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { IllnessService } from "./illness.service";
import { Request, Response } from "express";


export class IllnessController{
    private illnessService
    constructor(illnessService: IllnessService){
        this.illnessService = illnessService
    }

    public createIllness = asyncHandler(async (req: Request, res: Response) => {
        const validatedData = illnessSchema.parse(req.body);
        const illness = await this.illnessService.createIllness(validatedData);

        return res.status(HTTPSTATUS.CREATED).json({
            message: "Illness added successfully",
            illness,
        });
    });

    public getIllnesses = asyncHandler(async (_req: Request, res: Response) => {
        const illnesses = await this.illnessService.getIllnesses();
        return res.status(HTTPSTATUS.OK).json({ illnesses });
    });

    public getIllnessById = asyncHandler(async (req: Request, res: Response) => {
        const id = uuidSchema.parse(req.params.id);
        const illness = await this.illnessService.getIllnessById(id);

        return res.status(HTTPSTATUS.OK).json({ illness });
    });

    public updateIllness = asyncHandler(async (req: Request, res: Response) => {
        const id  = uuidSchema.parse(req.params.id);
        const validatedData = updateIllnessSchema.parse(req.body);
        const updatedIllness = await this.illnessService.updateIllness(id, validatedData);

        return res.status(HTTPSTATUS.OK).json({
            message: "Illness updated successfully",
            updatedIllness,
        });
    });

    public deleteIllness = asyncHandler(async (req: Request, res: Response) => {
        const id = uuidSchema.parse(req.params.id);
        await this.illnessService.deleteIllness(id);

        return res.status(HTTPSTATUS.OK).json({ message: "Illness deleted successfully" });
    });
}
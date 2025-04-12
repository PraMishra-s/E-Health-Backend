import { createIllnessCategorySchema, illnessSchema, updateIllnessCategorySchema, updateIllnessSchema } from "../../common/validators/illness.validator";
import { uuidSchema } from "../../common/validators/inventory.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { Request, Response } from "express";
import { IllnessCategoryService } from "./illnessCategory.service";


export class IllnessCategoryController{
    private illnessService
    constructor(illnessService: IllnessCategoryService){
        this.illnessService = illnessService
    }

    //Illness Category Controller
    public createCategory = asyncHandler(async (req: Request, res: Response) => {
        const data = createIllnessCategorySchema.parse(req.body);
        const category = await this.illnessService.createCategory(data);
        res.status(201).json({ message: 'Category created successfully', category });
    });

    public getAllCategories = asyncHandler(async (req: Request, res: Response) => {
        const categories = await this.illnessService.getAllCategories();
        res.status(200).json({ message: 'Categories retrieved successfully', categories });
    });

    public updateCategory = asyncHandler(async (req: Request, res: Response) => {
        const id = uuidSchema.parse(req.params.id);
        const data = updateIllnessCategorySchema.parse(req.body);
        const updatedCategory = await this.illnessService.updateCategory(id, data);
        res.status(200).json({ message: 'Category updated successfully', updatedCategory });
    });

    public deleteCategory = asyncHandler(async (req: Request, res: Response) => {
        const id = uuidSchema.parse(req.params.id);
        await this.illnessService.deleteCategory(id);
        res.status(200).json({ message: 'Category deleted successfully' });
    });
}
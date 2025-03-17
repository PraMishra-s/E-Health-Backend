import { User } from "../../common/@types";
import { UnauthorizedException } from "../../common/utils/catch-errors";
import { batchUpdateSchema, categorySchema, medicineSchema, transactionSchema, uuidSchema } from "../../common/validators/inventory.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { InventoryService } from "./inventory.service";

import { Request, Response } from "express";

export class InventoryController{
    private inventoryService
    constructor(inventoryService: InventoryService){
        this.inventoryService = inventoryService;
    }


    //Medicines_category
    public createCategory = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can manage categories.");
        }

        const validatedData = categorySchema.parse(req.body);
        const category = await this.inventoryService.createCategory(validatedData);

        res.status(HTTPSTATUS.CREATED).json({ message: "Category created successfully", category });
    });
    public getCategories = asyncHandler(async (req: Request, res: Response) => {
        const categories = await this.inventoryService.getCategories();
        res.status(HTTPSTATUS.OK).json({ categories });
    });
    public updateCategory = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        if (userType !== "HA" || !userType) {
            throw new UnauthorizedException("Only HA can manage categories.");
        }

        const categoryId = req.params.id;
        const validatedData = categorySchema.parse(req.body);
        const updatedCategory = await this.inventoryService.updateCategory(categoryId, validatedData);

        res.status(HTTPSTATUS.OK).json({ message: "Category updated successfully", category: updatedCategory });
    });

    public deleteCategory = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can manage categories.");
        }

        const categoryId = req.params.id;
        await this.inventoryService.deleteCategory(categoryId);

        res.status(HTTPSTATUS.OK).json({ message: "Category deleted successfully" });
    });
    public getCategoriesCount = asyncHandler(async (req: Request, res: Response) => {
        const categoriesCount = await this.inventoryService.getCategoriesCount();
        res.status(HTTPSTATUS.OK).json({ categoriesCount });
    })

    //Medicines
    public createMedicine = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can manage medicines.");
        }

        const validatedData = medicineSchema.parse(req.body);
        const medicine = await this.inventoryService.createMedicine(validatedData);

        res.status(HTTPSTATUS.CREATED).json({ message: "Medicine added successfully", medicine });
    });

    public getMedicines = asyncHandler(async (req: Request, res: Response) => {
        const medicines = await this.inventoryService.getMedicines();
        res.status(HTTPSTATUS.OK).json({ medicines });
    });
    public getMedicinesExpired = asyncHandler(async (req: Request, res: Response) => {
            const medicines = await this.inventoryService.getMedicinesExpired();
            res.status(HTTPSTATUS.OK).json({ medicines });
    });
    public getMedicineById = asyncHandler(async (req: Request, res: Response) => {
        const medicineId = req.params.id;
        const medicine = await this.inventoryService.getMedicineById(medicineId);
        res.status(HTTPSTATUS.OK).json({ medicine });
    });

    public updateMedicine = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can manage medicines.");
        }

        const medicineId = req.params.id;
        const validatedData = medicineSchema.parse(req.body);
        const updatedMedicine = await this.inventoryService.updateMedicine(medicineId, validatedData);

        res.status(HTTPSTATUS.OK).json({ message: "Medicine updated successfully", medicine: updatedMedicine });
    });

    public deleteMedicine = asyncHandler(async (req: Request, res: Response) => {
        const userType = (req.user as User)?.userType;
        if (userType !== "HA") {
            throw new UnauthorizedException("Only HA can manage medicines.");
        }

        const medicineId = req.params.id;
        await this.inventoryService.deleteMedicine(medicineId);

        res.status(HTTPSTATUS.OK).json({ message: "Medicine deleted successfully" });
    });

    //Medical Transactions
    public addStock = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        if (!userId) throw new UnauthorizedException("User not authenticated.");

        const validatedData = transactionSchema.parse(req.body);
        const transaction = await this.inventoryService.addStock(userId, validatedData);

        return res.status(HTTPSTATUS.CREATED).json({
            message: "Stock added successfully",
            transaction
        });
    });

    // ✅ Use medicine (For patient)
    public useMedicine = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        if (!userId) throw new UnauthorizedException("User not authenticated.");

        const validatedData = transactionSchema.parse(req.body);
        const transactions = await this.inventoryService.useMedicine(userId, validatedData);

        return res.status(HTTPSTATUS.OK).json({
            message: "Medicine used successfully",
            transactions
        });
    });

    // ✅ Remove stock (Damaged/Expired)
    public removeStock = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        if (!userId) throw new UnauthorizedException("User not authenticated.");

        const validatedData = transactionSchema.parse(req.body);
        const transaction = await this.inventoryService.removeStock(userId, validatedData);

        return res.status(HTTPSTATUS.OK).json({
            message: "Stock removed successfully",
            transaction
        });
    });

    // 🟢 Get transaction history
    public getTransactions = asyncHandler(async (req: Request, res: Response) => {
        const transactions = await this.inventoryService.getTransactions();
        return res.status(HTTPSTATUS.OK).json({ transactions });
    });

    //Medicine Batches
    public getBatchesById = asyncHandler(async (req: Request, res: Response) => {
        
        const { medicine_id } = req.params;
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;
        if (!userId || !userType) throw new UnauthorizedException("User not authenticated.");
        const batches = await this.inventoryService.getBatchesById(medicine_id);
        return res.status(HTTPSTATUS.OK).json({ message: "Batches retrieved successfully", batches });
    });
    public getBatches = asyncHandler(async (req: Request, res: Response) => {
        
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;
        if (!userId || !userType) throw new UnauthorizedException("User not authenticated.");
        const batches = await this.inventoryService.getBatches();
        return res.status(HTTPSTATUS.OK).json({ message: "Batches retrieved successfully", batches });
    });

    public updateBatch = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;
        if (!userId || !userType) throw new UnauthorizedException("User not authenticated.");
        console.log(req.body)
        const validatedData = batchUpdateSchema.parse(req.body);
        const updatedBatch = await this.inventoryService.updateBatch(id, validatedData);
        return res.status(HTTPSTATUS.OK).json({ message: "Batch updated successfully", batch: updatedBatch });
    });

    public deleteBatch = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        const userType = (req.user as User)?.userType;
        if (!userId || !userType) throw new UnauthorizedException("User not authenticated.");
        const { id } = req.params;
        await this.inventoryService.deleteBatch(id);
        return res.status(HTTPSTATUS.OK).json({ message: "Batch deleted successfully" });
    });
    public deleteBatchById = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req.user as User)?.id;
        if (!userId) throw new UnauthorizedException("User not authenticated.");

        const { id } = req.params;
        const validatedBatchId = uuidSchema.parse(id); // ✅ Validate batch_id

        const transaction = await this.inventoryService.deleteBatchById(userId, validatedBatchId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Batch deleted successfully.",
            transaction
        });
    });



}
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const inventory_validator_1 = require("../../common/validators/inventory.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class InventoryController {
    constructor(inventoryService) {
        //Medicines_category
        this.createCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can manage categories.");
            }
            const validatedData = inventory_validator_1.categorySchema.parse(req.body);
            const category = yield this.inventoryService.createCategory(validatedData);
            res.status(http_config_1.HTTPSTATUS.CREATED).json({ message: "Category created successfully", category });
        }));
        this.getCategories = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const categories = yield this.inventoryService.getCategories();
            res.status(http_config_1.HTTPSTATUS.OK).json({ categories });
        }));
        this.updateCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            if (userType !== "HA" || !userType) {
                throw new catch_errors_1.UnauthorizedException("Only HA can manage categories.");
            }
            const categoryId = req.params.id;
            const validatedData = inventory_validator_1.categorySchema.parse(req.body);
            const updatedCategory = yield this.inventoryService.updateCategory(categoryId, validatedData);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Category updated successfully", category: updatedCategory });
        }));
        this.deleteCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can manage categories.");
            }
            const categoryId = req.params.id;
            yield this.inventoryService.deleteCategory(categoryId);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Category deleted successfully" });
        }));
        this.getCategoriesCount = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const categoriesCount = yield this.inventoryService.getCategoriesCount();
            res.status(http_config_1.HTTPSTATUS.OK).json({ categoriesCount });
        }));
        //Medicines
        this.createMedicine = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can manage medicines.");
            }
            const validatedData = inventory_validator_1.medicineSchema.parse(req.body);
            const medicine = yield this.inventoryService.createMedicine(validatedData);
            res.status(http_config_1.HTTPSTATUS.CREATED).json({ message: "Medicine added successfully", medicine });
        }));
        this.getMedicines = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const medicines = yield this.inventoryService.getMedicines();
            res.status(http_config_1.HTTPSTATUS.OK).json({ medicines });
        }));
        this.getMedicinesExpired = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const medicines = yield this.inventoryService.getMedicinesExpired();
            res.status(http_config_1.HTTPSTATUS.OK).json({ medicines });
        }));
        this.getMedicineById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const medicineId = req.params.id;
            const medicine = yield this.inventoryService.getMedicineById(medicineId);
            res.status(http_config_1.HTTPSTATUS.OK).json({ medicine });
        }));
        this.updateMedicine = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can manage medicines.");
            }
            const medicineId = req.params.id;
            const validatedData = inventory_validator_1.medicineSchema.parse(req.body);
            const updatedMedicine = yield this.inventoryService.updateMedicine(medicineId, validatedData);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Medicine updated successfully", medicine: updatedMedicine });
        }));
        this.deleteMedicine = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            if (userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Only HA can manage medicines.");
            }
            const medicineId = req.params.id;
            yield this.inventoryService.deleteMedicine(medicineId);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Medicine deleted successfully" });
        }));
        //Medical Transactions
        this.addStock = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId)
                throw new catch_errors_1.UnauthorizedException("User not authenticated.");
            const validatedData = inventory_validator_1.transactionSchema.parse(req.body);
            const transaction = yield this.inventoryService.addStock(userId, validatedData);
            return res.status(http_config_1.HTTPSTATUS.CREATED).json({
                message: "Stock added successfully",
                transaction
            });
        }));
        // ✅ Use medicine (For patient)
        this.useMedicine = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId)
                throw new catch_errors_1.UnauthorizedException("User not authenticated.");
            const validatedData = inventory_validator_1.transactionSchema.parse(req.body);
            const transactions = yield this.inventoryService.useMedicine(userId, validatedData);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Medicine used successfully",
                transactions
            });
        }));
        // ✅ Remove stock (Damaged/Expired)
        this.removeStock = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId)
                throw new catch_errors_1.UnauthorizedException("User not authenticated.");
            const validatedData = inventory_validator_1.transactionSchema.parse(req.body);
            const transaction = yield this.inventoryService.removeStock(userId, validatedData);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Stock removed successfully",
                transaction
            });
        }));
        // 🟢 Get transaction history
        this.getTransactions = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.inventoryService.getTransactions();
            return res.status(http_config_1.HTTPSTATUS.OK).json({ transactions });
        }));
        //Medicine Batches
        this.getBatchesById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { medicine_id } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || !userType)
                throw new catch_errors_1.UnauthorizedException("User not authenticated.");
            const batches = yield this.inventoryService.getBatchesById(medicine_id);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Batches retrieved successfully", batches });
        }));
        this.getBatches = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || !userType)
                throw new catch_errors_1.UnauthorizedException("User not authenticated.");
            const batches = yield this.inventoryService.getBatches();
            return res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Batches retrieved successfully", batches });
        }));
        this.updateBatch = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { id } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || !userType)
                throw new catch_errors_1.UnauthorizedException("User not authenticated.");
            console.log(req.body);
            const validatedData = inventory_validator_1.batchUpdateSchema.parse(req.body);
            const updatedBatch = yield this.inventoryService.updateBatch(id, validatedData);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Batch updated successfully", batch: updatedBatch });
        }));
        this.deleteBatch = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || !userType)
                throw new catch_errors_1.UnauthorizedException("User not authenticated.");
            const { id } = req.params;
            yield this.inventoryService.deleteBatch(id);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Batch deleted successfully" });
        }));
        this.deleteBatchById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId)
                throw new catch_errors_1.UnauthorizedException("User not authenticated.");
            const { id } = req.params;
            const validatedBatchId = inventory_validator_1.uuidSchema.parse(id); // ✅ Validate batch_id
            const transaction = yield this.inventoryService.deleteBatchById(userId, validatedBatchId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Batch deleted successfully.",
                transaction
            });
        }));
        this.inventoryService = inventoryService;
    }
}
exports.InventoryController = InventoryController;

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
exports.IllnessCategoryController = void 0;
const illness_validator_1 = require("../../common/validators/illness.validator");
const inventory_validator_1 = require("../../common/validators/inventory.validator");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class IllnessCategoryController {
    constructor(illnessService) {
        //Illness Category Controller
        this.createCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const data = illness_validator_1.createIllnessCategorySchema.parse(req.body);
            const category = yield this.illnessService.createCategory(data);
            res.status(201).json({ message: 'Category created successfully', category });
        }));
        this.getAllCategories = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const categories = yield this.illnessService.getAllCategories();
            res.status(200).json({ message: 'Categories retrieved successfully', categories });
        }));
        this.updateCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            const data = illness_validator_1.updateIllnessCategorySchema.parse(req.body);
            const updatedCategory = yield this.illnessService.updateCategory(id, data);
            res.status(200).json({ message: 'Category updated successfully', updatedCategory });
        }));
        this.deleteCategory = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            yield this.illnessService.deleteCategory(id);
            res.status(200).json({ message: 'Category deleted successfully' });
        }));
        this.illnessService = illnessService;
    }
}
exports.IllnessCategoryController = IllnessCategoryController;

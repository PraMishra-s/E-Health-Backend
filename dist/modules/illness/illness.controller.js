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
exports.IllnessController = void 0;
const illness_validator_1 = require("../../common/validators/illness.validator");
const inventory_validator_1 = require("../../common/validators/inventory.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class IllnessController {
    constructor(illnessService) {
        this.createIllness = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const validatedData = illness_validator_1.illnessSchema.parse(req.body);
            const illness = yield this.illnessService.createIllness(validatedData);
            return res.status(http_config_1.HTTPSTATUS.CREATED).json({
                message: "Illness added successfully",
                illness,
            });
        }));
        this.getIllnesses = (0, asyncHandler_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const illnesses = yield this.illnessService.getIllnesses();
            return res.status(http_config_1.HTTPSTATUS.OK).json({ illnesses });
        }));
        this.getIllnessById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            const illness = yield this.illnessService.getIllnessById(id);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ illness });
        }));
        this.updateIllness = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            const validatedData = illness_validator_1.updateIllnessSchema.parse(req.body);
            const updatedIllness = yield this.illnessService.updateIllness(id, validatedData);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Illness updated successfully",
                updatedIllness,
            });
        }));
        this.deleteIllness = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = inventory_validator_1.uuidSchema.parse(req.params.id);
            yield this.illnessService.deleteIllness(id);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Illness deleted successfully" });
        }));
        this.illnessService = illnessService;
    }
}
exports.IllnessController = IllnessController;

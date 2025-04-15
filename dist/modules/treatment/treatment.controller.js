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
exports.TreatmentController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const inventory_validator_1 = require("../../common/validators/inventory.validator");
const treatment_validator_1 = require("../../common/validators/treatment.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class TreatmentController {
    constructor(treatmentService) {
        this.addTreatment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const validatedData = treatment_validator_1.createTreatmentSchema.parse(req.body);
            console.log(validatedData);
            const treatment = yield this.treatmentService.addTreatment(userId, validatedData);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Treatment record created.", treatment });
        }));
        // ✅ Update Treatment
        this.updateTreatment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const treatmentId = inventory_validator_1.uuidSchema.parse(req.params.id);
            const validatedData = treatment_validator_1.updateTreatmentSchema.parse(req.body);
            const updatedTreatment = yield this.treatmentService.updateTreatment(treatmentId, validatedData);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Treatment updated.", updatedTreatment });
        }));
        // ✅ Get all treatments for a patient
        this.getPatientTreatments = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const patientId = inventory_validator_1.uuidSchema.parse(req.params.id);
            const treatments = yield this.treatmentService.getPatientTreatments(patientId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ treatments });
        }));
        // ✅ Get single treatment details
        this.getTreatmentById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const treatmentId = inventory_validator_1.uuidSchema.parse(req.params.id);
            const treatment = yield this.treatmentService.getTreatmentById(treatmentId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ treatment });
        }));
        this.getAllTreatment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const treatments = yield this.treatmentService.getAllTreatment();
            return res.status(http_config_1.HTTPSTATUS.OK).json({ treatments });
        }));
        this.getAllStudents = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userType = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userType;
            console.log(userType);
            if (userType !== "STAFF" && userType !== "DEAN" && userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const treatments = yield this.treatmentService.getAllStudents();
            return res.status(http_config_1.HTTPSTATUS.OK).json({ treatments });
        }));
        // ✅ Delete Treatment
        this.deleteTreatment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== "HA") {
                throw new catch_errors_1.UnauthorizedException("Unauthorized access.", "ACCESS_FORBIDDEN" /* ErrorCode.ACCESS_FORBIDDEN */);
            }
            const treatmentId = inventory_validator_1.uuidSchema.parse(req.params.id);
            yield this.treatmentService.deleteTreatment(treatmentId);
            return res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Treatment deleted successfully." });
        }));
        this.treatmentService = treatmentService;
    }
}
exports.TreatmentController = TreatmentController;

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
exports.StaffController = void 0;
const catch_errors_1 = require("../../common/utils/catch-errors");
const staffFamily_validator_1 = require("../../common/validators/staffFamily.validator");
const http_config_1 = require("../../config/http.config");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
class StaffController {
    constructor(staffService) {
        this.createFamilyMember = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const userType = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType;
            if (!userId || userType !== 'HA') {
                throw new catch_errors_1.UnauthorizedException("Only HA is authorized to do this", "ACCESS_UNAUTHORIZED" /* ErrorCode.ACCESS_UNAUTHORIZED */);
            }
            const validatedData = staffFamily_validator_1.staffFamilySchema.parse(req.body);
            const familyMember = yield this.staffService.createFamilyMember(validatedData);
            res.status(http_config_1.HTTPSTATUS.CREATED).json({ message: "Family member added successfully", familyMember });
        }));
        this.getFamilyMembers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { staff_id } = req.params;
            const familyMembers = yield this.staffService.getFamilyMembers(staff_id);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Family members retrieved", familyMembers });
        }));
        this.getAllFamilyMembers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { staff_id } = req.params;
            const familyMembers = yield this.staffService.getAllFamilyMembers(staff_id);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Family members retrieved", familyMembers });
        }));
        this.updateFamilyMember = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            const validatedData = staffFamily_validator_1.updateStaffFamilySchema.parse(req.body);
            const updatedMember = yield this.staffService.updateFamilyMember(id, validatedData);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Family member updated", updatedMember });
        }));
        // 🟢 Soft delete family member
        this.deleteFamilyMember = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            yield this.staffService.deleteFamilyMember(id);
            res.status(http_config_1.HTTPSTATUS.OK).json({ message: "Family member removed successfully" });
        }));
        this.hardDeleteFamilyMember = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            yield this.staffService.hardDeleteFamilyMember(id);
            return res.status(http_config_1.HTTPSTATUS.OK).json({
                message: "Family member permanently deleted."
            });
        }));
        this.staffService = staffService;
    }
}
exports.StaffController = StaffController;

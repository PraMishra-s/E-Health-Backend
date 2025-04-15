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
exports.IllnessService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const catch_errors_1 = require("../../common/utils/catch-errors");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
class IllnessService {
    createIllness(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [illness] = yield drizzle_1.db.insert(schema_1.illnesses).values(data).returning();
            return illness;
        });
    }
    getIllnesses() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield drizzle_1.db.select().from(schema_1.illnesses);
        });
    }
    getIllnessById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [illness] = yield drizzle_1.db.select().from(schema_1.illnesses).where((0, drizzle_orm_1.eq)(schema_1.illnesses.id, id));
            if (!illness)
                throw new catch_errors_1.NotFoundException("Illness not found", "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
            return illness;
        });
    }
    updateIllness(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updatedIllness] = yield drizzle_1.db.update(schema_1.illnesses).set(data).where((0, drizzle_orm_1.eq)(schema_1.illnesses.id, id)).returning();
            if (!updatedIllness)
                throw new catch_errors_1.NotFoundException("Illness not found", "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
            return updatedIllness;
        });
    }
    deleteIllness(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield drizzle_1.db.delete(schema_1.illnesses).where((0, drizzle_orm_1.eq)(schema_1.illnesses.id, id));
            if (!result.rowCount)
                throw new catch_errors_1.NotFoundException("Illness not found", "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
        });
    }
}
exports.IllnessService = IllnessService;

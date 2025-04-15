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
exports.IllnessCategoryService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
class IllnessCategoryService {
    createCategory(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [existing] = yield drizzle_1.db.select()
                .from(schema_1.illness_categories)
                .where((0, drizzle_orm_1.eq)(schema_1.illness_categories.name, data.name));
            if (existing) {
                throw new Error("Category with this name already exists");
            }
            const [category] = yield drizzle_1.db.insert(schema_1.illness_categories)
                .values(data)
                .returning();
            return category;
        });
    }
    getAllCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield drizzle_1.db.select().from(schema_1.illness_categories);
        });
    }
    updateCategory(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updated] = yield drizzle_1.db.update(schema_1.illness_categories).set(data).where((0, drizzle_orm_1.eq)(schema_1.illness_categories.id, id)).returning();
            return updated;
        });
    }
    deleteCategory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield drizzle_1.db.delete(schema_1.illness_categories).where((0, drizzle_orm_1.eq)(schema_1.illness_categories.id, id));
        });
    }
}
exports.IllnessCategoryService = IllnessCategoryService;

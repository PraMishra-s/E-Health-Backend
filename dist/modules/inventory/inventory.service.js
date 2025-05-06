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
exports.InventoryService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const catch_errors_1 = require("../../common/utils/catch-errors");
const drizzle_1 = require("../../database/drizzle");
const schema_1 = require("../../database/schema/schema");
class InventoryService {
    createCategory(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newCategory] = yield drizzle_1.db.insert(schema_1.medicine_categories).values(data).returning();
            return newCategory;
        });
    }
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield drizzle_1.db.select().from(schema_1.medicine_categories);
        });
    }
    updateCategory(categoryId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updatedCategory] = yield drizzle_1.db
                .update(schema_1.medicine_categories)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema_1.medicine_categories.id, categoryId))
                .returning();
            if (!updatedCategory)
                throw new catch_errors_1.NotFoundException("Category not found.");
            return updatedCategory;
        });
    }
    deleteCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield drizzle_1.db.delete(schema_1.medicine_categories).where((0, drizzle_orm_1.eq)(schema_1.medicine_categories.id, categoryId)).returning();
            if (!deleted.length)
                throw new catch_errors_1.NotFoundException("Category not found.");
        });
    }
    getCategoriesCount() {
        return __awaiter(this, void 0, void 0, function* () {
            const medicineCounts = yield drizzle_1.db
                .select({
                id: schema_1.medicine_categories.id,
                category: schema_1.medicine_categories.name,
                total: (0, drizzle_orm_1.sql) `COALESCE(COUNT(medicines.id), 0)`
            })
                .from(schema_1.medicine_categories)
                .leftJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.medicines.category_id, schema_1.medicine_categories.id))
                .groupBy(schema_1.medicine_categories.id, schema_1.medicine_categories.name);
            if (medicineCounts.length === 0) {
                throw new catch_errors_1.NotFoundException("No medicine categories found.");
            }
            return medicineCounts;
        });
    }
    createMedicine(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newMedicine] = yield drizzle_1.db.insert(schema_1.medicines).values(data).returning();
            return newMedicine;
        });
    }
    getMedicines() {
        return __awaiter(this, void 0, void 0, function* () {
            const newmedicines = yield drizzle_1.db
                .select({
                id: schema_1.medicines.id,
                name: schema_1.medicines.name,
                category_id: schema_1.medicines.category_id,
                unit: schema_1.medicines.unit,
                created_at: schema_1.medicines.created_at,
                updated_at: schema_1.medicines.updated_at,
                batches: (0, drizzle_orm_1.sql) `json_agg(json_build_object(
                    'id', medicine_batches.id,
                    'batch_name', medicine_batches.batch_name,
                    'quantity', medicine_batches.quantity,
                    'expiry_date', medicine_batches.expiry_date
                )) FILTER (WHERE medicine_batches.id IS NOT NULL AND medicine_batches.is_deleted = false)`.as("batches") // ✅ Aggregate batches into an array
            })
                .from(schema_1.medicines)
                .leftJoin(schema_1.medicine_batches, (0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, schema_1.medicines.id)) // ✅ Left join to include medicines even if they have no batches
                .groupBy(schema_1.medicines.id); // ✅ Group by medicine to avoid duplication
            return newmedicines;
        });
    }
    getMedicinesExpired() {
        return __awaiter(this, void 0, void 0, function* () {
            const expiredBatches = yield drizzle_1.db
                .select({
                batch_id: schema_1.medicine_batches.id,
                batch_name: schema_1.medicine_batches.batch_name,
                medicine_id: schema_1.medicine_batches.medicine_id,
                medicine_name: schema_1.medicines.name, // ✅ Fetch medicine name
                medicine_categories: schema_1.medicines.category_id,
                expiry_date: schema_1.medicine_batches.expiry_date,
                remaining_stock: schema_1.medicine_batches.quantity, // ✅ Get remaining stock in the expired batch
            })
                .from(schema_1.medicine_batches)
                .innerJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, schema_1.medicines.id)) // ✅ Link batch to medicine
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lt)(schema_1.medicine_batches.expiry_date, new Date()), (0, drizzle_orm_1.eq)(schema_1.medicine_batches.is_deleted, false)));
            const [{ count }] = yield drizzle_1.db
                .select({ count: (0, drizzle_orm_1.sql) `COUNT(*)` })
                .from(schema_1.medicine_batches)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lt)(schema_1.medicine_batches.expiry_date, new Date()), (0, drizzle_orm_1.eq)(schema_1.medicine_batches.is_deleted, false) // ✅ Only count non-deleted batches
            ));
            return {
                message: expiredBatches.length > 0 ? "Expired medicines retrieved." : "No expired medicines found.",
                totalExpiredBatches: count || 0,
                expiredBatches,
            };
        });
    }
    getMedicineById(medicineId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [medicine] = yield drizzle_1.db.select().from(schema_1.medicines).where((0, drizzle_orm_1.eq)(schema_1.medicines.id, medicineId));
            if (!medicine)
                throw new catch_errors_1.NotFoundException("Medicine not found.");
            return medicine;
        });
    }
    updateMedicine(medicineId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updatedMedicine] = yield drizzle_1.db
                .update(schema_1.medicines)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema_1.medicines.id, medicineId))
                .returning();
            if (!updatedMedicine)
                throw new catch_errors_1.NotFoundException("Medicine not found.");
            return updatedMedicine;
        });
    }
    deleteMedicine(medicineId) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield drizzle_1.db.delete(schema_1.medicines).where((0, drizzle_orm_1.eq)(schema_1.medicines.id, medicineId)).returning();
            if (!deleted.length)
                throw new catch_errors_1.NotFoundException("Medicine not found.");
        });
    }
    addStock(userId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (userId, { medicine_id, batch_name, quantity, expiry_date, reason }) {
            if (quantity <= 0) {
                throw new catch_errors_1.BadRequestException("Invalid stock quantity.", "INVALID_REQUEST" /* ErrorCode.INVALID_REQUEST */);
            }
            // ✅ Check if batch name already exists for the same medicine
            const existingBatch = yield drizzle_1.db
                .select()
                .from(schema_1.medicine_batches)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, medicine_id), (0, drizzle_orm_1.eq)(schema_1.medicine_batches.batch_name, batch_name)))
                .limit(1);
            if (existingBatch.length > 0) {
                throw new catch_errors_1.BadRequestException("Batch name already exists for this medicine.", "INVALID_REQUEST" /* ErrorCode.INVALID_REQUEST */);
            }
            // ✅ Insert new batch
            const [newBatch] = yield drizzle_1.db.insert(schema_1.medicine_batches).values({
                medicine_id,
                batch_name, // ✅ Now ensuring it's unique per medicine
                quantity,
                expiry_date,
            }).returning();
            // ✅ Log transaction
            const [transaction] = yield drizzle_1.db.insert(schema_1.inventory_transactions).values({
                batch_id: newBatch.id,
                medicine_id: newBatch.medicine_id,
                batch_name: newBatch.batch_name,
                change: quantity,
                type: "ADDED",
                reason,
                user_id: userId
            }).returning();
            return transaction;
        });
    }
    // ✅ Use medicine (FIFO approach: oldest batch first)
    useMedicine(userId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (userId, { medicine_id, quantity, reason, patient_id, family_member_id }) {
            if (quantity <= 0) {
                throw new catch_errors_1.BadRequestException("Invalid medicine quantity.", "INVALID_REQUEST" /* ErrorCode.INVALID_REQUEST */);
            }
            // ✅ Fetch oldest batches (FIFO) that still have stock
            const batches = yield drizzle_1.db
                .select()
                .from(schema_1.medicine_batches)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, medicine_id), (0, drizzle_orm_1.eq)(schema_1.medicine_batches.is_deleted, false)))
                .orderBy(schema_1.medicine_batches.expiry_date) // FIFO: Oldest batch first
                .limit(5); // Limit to reduce DB calls
            let remainingToDeduct = quantity;
            let transactions = [];
            for (const batch of batches) {
                if (remainingToDeduct <= 0)
                    break;
                const deductAmount = Math.min(batch.quantity, remainingToDeduct);
                remainingToDeduct -= deductAmount;
                // ✅ Deduct from batch
                yield drizzle_1.db.update(schema_1.medicine_batches)
                    .set({ quantity: (0, drizzle_orm_1.sql) `${schema_1.medicine_batches.quantity} - ${deductAmount}` })
                    .where((0, drizzle_orm_1.eq)(schema_1.medicine_batches.id, batch.id));
                // ✅ Log transaction
                const [transaction] = yield drizzle_1.db.insert(schema_1.inventory_transactions).values({
                    batch_id: batch.id,
                    medicine_id: batch.medicine_id,
                    batch_name: batch.batch_name,
                    change: -deductAmount,
                    type: "USED_FOR_PATIENT",
                    reason,
                    user_id: userId,
                    patient_id: patient_id || null,
                    family_member_id: family_member_id || null,
                }).returning();
                transactions.push(transaction);
            }
            if (remainingToDeduct > 0) {
                throw new catch_errors_1.BadRequestException("Not enough stock available.", "OUT_OF_STOCK" /* ErrorCode.OUT_OF_STOCK */);
            }
            return transactions;
        });
    }
    // ✅ Remove stock (Damaged/Expired) - Only affects specific batch
    removeStock(userId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (userId, { batch_id, quantity, reason }) {
            if (quantity <= 0) {
                throw new catch_errors_1.BadRequestException("Invalid quantity.", "INVALID_REQUEST" /* ErrorCode.INVALID_REQUEST */);
            }
            // ✅ Fetch batch
            const [batch] = yield drizzle_1.db
                .select()
                .from(schema_1.medicine_batches)
                .where((0, drizzle_orm_1.eq)(schema_1.medicine_batches.id, batch_id));
            if (!batch) {
                throw new catch_errors_1.NotFoundException("Batch not found.", "RESOURCE_NOT_FOUND" /* ErrorCode.RESOURCE_NOT_FOUND */);
            }
            if (batch.quantity < quantity) {
                throw new catch_errors_1.BadRequestException("Not enough stock in this batch.", "OUT_OF_STOCK" /* ErrorCode.OUT_OF_STOCK */);
            }
            // ✅ Deduct from batch
            yield drizzle_1.db.update(schema_1.medicine_batches)
                .set({ quantity: (0, drizzle_orm_1.sql) `${schema_1.medicine_batches.quantity} - ${quantity}` })
                .where((0, drizzle_orm_1.eq)(schema_1.medicine_batches.id, batch_id));
            // ✅ Log transaction
            const [transaction] = yield drizzle_1.db.insert(schema_1.inventory_transactions).values({
                batch_id,
                medicine_id: batch.medicine_id,
                batch_name: batch.batch_name,
                change: -quantity,
                type: "REMOVED",
                reason,
                user_id: userId
            }).returning();
            return transaction;
        });
    }
    getTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield drizzle_1.db
                .select({
                id: schema_1.inventory_transactions.id,
                batch_id: schema_1.inventory_transactions.batch_id,
                batch_name: schema_1.inventory_transactions.batch_name,
                medicine_id: schema_1.inventory_transactions.medicine_id,
                medicine_name: schema_1.medicines.name,
                change: schema_1.inventory_transactions.change,
                type: schema_1.inventory_transactions.type,
                reason: schema_1.inventory_transactions.reason,
                user_id: schema_1.inventory_transactions.user_id,
                patient_id: schema_1.inventory_transactions.patient_id,
                created_at: schema_1.inventory_transactions.created_at,
            })
                .from(schema_1.inventory_transactions)
                .leftJoin(schema_1.medicine_batches, (0, drizzle_orm_1.eq)(schema_1.inventory_transactions.batch_id, schema_1.medicine_batches.id)) // ✅ Still link batches if available
                .leftJoin(schema_1.medicines, (0, drizzle_orm_1.eq)(schema_1.inventory_transactions.medicine_id, schema_1.medicines.id)) // ✅ Still link medicines if available
                .orderBy((0, drizzle_orm_1.sql) `created_at DESC`);
        });
    }
    getBatches() {
        return __awaiter(this, void 0, void 0, function* () {
            const batchList = yield drizzle_1.db.select().from(schema_1.medicine_batches);
            if (batchList.length === 0) {
                throw new catch_errors_1.NotFoundException("No batches found for this medicine.");
            }
            return batchList;
        });
    }
    getBatchesById(medicine_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const batchList = yield drizzle_1.db.select().from(schema_1.medicine_batches).where((0, drizzle_orm_1.eq)(schema_1.medicine_batches.medicine_id, medicine_id));
            if (batchList.length === 0) {
                throw new catch_errors_1.NotFoundException("No batches found for this medicine.");
            }
            return batchList;
        });
    }
    updateBatch(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updatedBatch] = yield drizzle_1.db.update(schema_1.medicine_batches)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema_1.medicine_batches.id, id))
                .returning();
            if (!updatedBatch) {
                throw new catch_errors_1.NotFoundException("Batch not found.");
            }
            return updatedBatch;
        });
    }
    deleteBatch(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield drizzle_1.db.delete(schema_1.medicine_batches).where((0, drizzle_orm_1.eq)(schema_1.medicine_batches.id, id)).returning();
            if (!deleted.length) {
                throw new catch_errors_1.NotFoundException("Batch not found.");
            }
        });
    }
    deleteBatchById(userId, batch_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [batch] = yield drizzle_1.db
                .select({ medicine_id: schema_1.medicine_batches.medicine_id, quantity: schema_1.medicine_batches.quantity, batch_name: schema_1.medicine_batches.batch_name })
                .from(schema_1.medicine_batches)
                .where((0, drizzle_orm_1.eq)(schema_1.medicine_batches.id, batch_id));
            if (!batch) {
                throw new catch_errors_1.NotFoundException("Batch not found.");
            }
            // ✅ Log transaction
            const [transaction] = yield drizzle_1.db.insert(schema_1.inventory_transactions).values({
                batch_name: batch.batch_name,
                medicine_id: batch.medicine_id,
                change: -batch.quantity,
                type: "REMOVED",
                reason: "Expired or damaged",
                user_id: userId,
            }).returning();
            // ✅ Delete the batch
            yield drizzle_1.db.update(schema_1.medicine_batches)
                .set({ is_deleted: true })
                .where((0, drizzle_orm_1.eq)(schema_1.medicine_batches.id, batch_id));
            return transaction;
        });
    }
}
exports.InventoryService = InventoryService;

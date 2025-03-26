import { and, eq, lt, sql } from "drizzle-orm";
import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import { db } from "../../database/drizzle";
import { inventory_transactions, medicine_batches, medicine_categories, medicines } from "../../database/schema/schema";
import { ErrorCode } from "../../common/enums/error-code.enum";

export class InventoryService{
    public async createCategory(data: { name: string }) {
        const [newCategory] = await db.insert(medicine_categories).values(data).returning();
        return newCategory;
    }
    public async getCategories() {
        return await db.select().from(medicine_categories);
    }
    public async updateCategory(categoryId: string, data: { name: string }) {
        const [updatedCategory] = await db
            .update(medicine_categories)
            .set(data)
            .where(eq(medicine_categories.id, categoryId))
            .returning();

        if (!updatedCategory) throw new NotFoundException("Category not found.");
        return updatedCategory;
    }

    public async deleteCategory(categoryId: string) {
        const deleted = await db.delete(medicine_categories).where(eq(medicine_categories.id, categoryId)).returning();
        if (!deleted.length) throw new NotFoundException("Category not found.");
    }
   public async getCategoriesCount() {
    const medicineCounts = await db
        .select({
            id: medicine_categories.id,
            category: medicine_categories.name,
            total: sql<number>`COALESCE(COUNT(medicines.id), 0)`
        })
        .from(medicine_categories)
        .leftJoin(medicines, eq(medicines.category_id, medicine_categories.id))
        .groupBy(medicine_categories.id, medicine_categories.name);


        if (medicineCounts.length === 0) {
            throw new NotFoundException("No medicine categories found.");
        }

        return medicineCounts;
    }

    public async createMedicine(data: { name: string; category_id: string; unit: string }) {
        const [newMedicine] = await db.insert(medicines).values(data).returning();
        return newMedicine;
    }

    public async getMedicines() {
        const newmedicines = await db
            .select({
                id: medicines.id,
                name: medicines.name,
                category_id: medicines.category_id,
                unit: medicines.unit,
                created_at: medicines.created_at,
                updated_at: medicines.updated_at,
                batches: sql<any>`json_agg(json_build_object(
                    'id', medicine_batches.id,
                    'batch_name', medicine_batches.batch_name,
                    'quantity', medicine_batches.quantity,
                    'expiry_date', medicine_batches.expiry_date
                )) FILTER (WHERE medicine_batches.id IS NOT NULL)`.as("batches")  // ✅ Aggregate batches into an array
            })
            .from(medicines)
            .leftJoin(medicine_batches, eq(medicine_batches.medicine_id, medicines.id))  // ✅ Left join to include medicines even if they have no batches
            .groupBy(medicines.id);  // ✅ Group by medicine to avoid duplication

        return newmedicines;
    }


    public async getMedicinesExpired() {
        const expiredBatches = await db
            .select({
                batch_id: medicine_batches.id,
                batch_name: medicine_batches.batch_name,
                medicine_id: medicine_batches.medicine_id,
                medicine_name: medicines.name, // ✅ Fetch medicine name
                medicine_categories: medicines.category_id,
                expiry_date: medicine_batches.expiry_date,
                remaining_stock: medicine_batches.quantity, // ✅ Get remaining stock in the expired batch
            })
            .from(medicine_batches)
            .innerJoin(medicines, eq(medicine_batches.medicine_id, medicines.id)) // ✅ Link batch to medicine
            .where(lt(medicine_batches.expiry_date, new Date()));

        const [{ count }] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(medicine_batches)
            .where(lt(medicine_batches.expiry_date, new Date()));

        return {
            message: expiredBatches.length > 0 ? "Expired medicines retrieved." : "No expired medicines found.",
            totalExpiredBatches: count || 0,
            expiredBatches,
        };
    }



    public async getMedicineById(medicineId: string) {
        const [medicine] = await db.select().from(medicines).where(eq(medicines.id, medicineId));
        if (!medicine) throw new NotFoundException("Medicine not found.");
        return medicine;
    }

    public async updateMedicine(medicineId: string, data: { name: string; category_id: string; }) {
        const [updatedMedicine] = await db
            .update(medicines)
            .set(data)
            .where(eq(medicines.id, medicineId))
            .returning();

        if (!updatedMedicine) throw new NotFoundException("Medicine not found.");
        return updatedMedicine;
    }

    public async deleteMedicine(medicineId: string) {
        const deleted = await db.delete(medicines).where(eq(medicines.id, medicineId)).returning();
        if (!deleted.length) throw new NotFoundException("Medicine not found.");
    }
    public async addStock(userId: string, { medicine_id, batch_name, quantity, expiry_date, reason }: any) {
        if (quantity <= 0) {
            throw new BadRequestException("Invalid stock quantity.", ErrorCode.INVALID_REQUEST);
        }

        // ✅ Check if batch name already exists for the same medicine
        const existingBatch = await db
            .select()
            .from(medicine_batches)
            .where(and(eq(medicine_batches.medicine_id, medicine_id), eq(medicine_batches.batch_name, batch_name)))
            .limit(1);

        if (existingBatch.length > 0) {
            throw new BadRequestException("Batch name already exists for this medicine.", ErrorCode.INVALID_REQUEST);
        }

        // ✅ Insert new batch
        const [newBatch] = await db.insert(medicine_batches).values({
            medicine_id,
            batch_name,  // ✅ Now ensuring it's unique per medicine
            quantity,
            expiry_date,
        }).returning();

        // ✅ Log transaction
        const [transaction] = await db.insert(inventory_transactions).values({
            batch_id: newBatch.id,
            medicine_id: newBatch.medicine_id,
            batch_name: newBatch.batch_name,
            change: quantity,
            type: "ADDED",
            reason,
            user_id: userId
        }).returning();

        return transaction;
    }

    // ✅ Use medicine (FIFO approach: oldest batch first)
    public async useMedicine(userId: string, { medicine_id, quantity, reason, patient_id,family_member_id }: any) {
        if (quantity <= 0) {
            throw new BadRequestException("Invalid medicine quantity.", ErrorCode.INVALID_REQUEST);
        }

        // ✅ Fetch oldest batches (FIFO) that still have stock
        const batches = await db
            .select()
            .from(medicine_batches)
            .where(eq(medicine_batches.medicine_id, medicine_id))
            .orderBy(medicine_batches.expiry_date) // FIFO: Oldest batch first
            .limit(5); // Limit to reduce DB calls

        let remainingToDeduct = quantity;
        let transactions = [];

        for (const batch of batches) {
            if (remainingToDeduct <= 0) break;

            const deductAmount = Math.min(batch.quantity, remainingToDeduct);
            remainingToDeduct -= deductAmount;

            // ✅ Deduct from batch
            await db.update(medicine_batches)
                .set({ quantity: sql`${medicine_batches.quantity} - ${deductAmount}` })
                .where(eq(medicine_batches.id, batch.id));

            // ✅ Log transaction
            const [transaction] = await db.insert(inventory_transactions).values({
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
            throw new BadRequestException("Not enough stock available.", ErrorCode.OUT_OF_STOCK);
        }

        return transactions;
    }

    // ✅ Remove stock (Damaged/Expired) - Only affects specific batch
    public async removeStock(userId: string, { batch_id, quantity, reason }: any) {
        if (quantity <= 0) {
            throw new BadRequestException("Invalid quantity.", ErrorCode.INVALID_REQUEST);
        }

        // ✅ Fetch batch
        const [batch] = await db
            .select()
            .from(medicine_batches)
            .where(eq(medicine_batches.id, batch_id));

        if (!batch) {
            throw new NotFoundException("Batch not found.", ErrorCode.RESOURCE_NOT_FOUND);
        }

        if (batch.quantity < quantity) {
            throw new BadRequestException("Not enough stock in this batch.", ErrorCode.OUT_OF_STOCK);
        }

        // ✅ Deduct from batch
        await db.update(medicine_batches)
            .set({ quantity: sql`${medicine_batches.quantity} - ${quantity}` })
            .where(eq(medicine_batches.id, batch_id));

        // ✅ Log transaction
        const [transaction] = await db.insert(inventory_transactions).values({
            batch_id,
            medicine_id: batch.medicine_id,
            batch_name: batch.batch_name,
            change: -quantity,
            type: "REMOVED",
            reason,
            user_id: userId
        }).returning();

        return transaction;
    }
 public async getTransactions() {
    return await db
        .select({
            id: inventory_transactions.id,
            batch_id: inventory_transactions.batch_id,
            batch_name: inventory_transactions.batch_name,
            medicine_id: inventory_transactions.medicine_id,
            medicine_name: medicines.name,
            change: inventory_transactions.change,
            type: inventory_transactions.type,
            reason: inventory_transactions.reason,
            user_id: inventory_transactions.user_id,
            patient_id: inventory_transactions.patient_id,
            created_at: inventory_transactions.created_at,
        })
        .from(inventory_transactions)
        .leftJoin(medicine_batches, eq(inventory_transactions.batch_id, medicine_batches.id)) // ✅ Still link batches if available
        .leftJoin(medicines, eq(inventory_transactions.medicine_id, medicines.id)) // ✅ Still link medicines if available
        .orderBy(sql`created_at DESC`);

    }

    public async getBatches() {
        const batchList = await db.select().from(medicine_batches);

        if (batchList.length === 0) {
            throw new NotFoundException("No batches found for this medicine.");
        }

        return batchList;
    }
    public async getBatchesById(medicine_id: string) {
        const batchList = await db.select().from(medicine_batches).where(eq(medicine_batches.medicine_id, medicine_id));

        if (batchList.length === 0) {
            throw new NotFoundException("No batches found for this medicine.");
        }

        return batchList;
    }

    public async updateBatch(id: string, data: any) {

        const [updatedBatch] = await db.update(medicine_batches)
            .set(data)
            .where(eq(medicine_batches.id, id))
            .returning();

        if (!updatedBatch) {
            throw new NotFoundException("Batch not found.");
        }

        return updatedBatch;
    }

    public async deleteBatch(id: string) {
        const deleted = await db.delete(medicine_batches).where(eq(medicine_batches.id, id)).returning();

        if (!deleted.length) {
            throw new NotFoundException("Batch not found.");
        }
    }
    public async deleteBatchById(userId: string, batch_id: string) {
        console.log(`this is batch_id : ${batch_id}`)
        // ✅ Fetch the batch details
        const [batch] = await db
            .select({ medicine_id: medicine_batches.medicine_id, quantity: medicine_batches.quantity, batch_name: medicine_batches.batch_name})
            .from(medicine_batches)
            .where(eq(medicine_batches.id, batch_id));

        if (!batch) {
            throw new NotFoundException("Batch not found.");
        }

        
        // ✅ Log transaction
        const [transaction] = await db.insert(inventory_transactions).values({
            batch_name: batch.batch_name,
            medicine_id: batch.medicine_id,
            change: -batch.quantity, 
            type: "REMOVED",
            reason: "Expired or damaged",
            user_id: userId,
        }).returning(); 
        // ✅ Delete the batch
        await db.delete(medicine_batches).where(eq(medicine_batches.id, batch_id));

        return transaction;
    }



}
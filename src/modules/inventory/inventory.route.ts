import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { inventoryController } from "./inventory.module";


const inventoryRoutes = Router()

// Medicine_Categories Routes
inventoryRoutes.post("/categories/add", authenticateJWT, inventoryController.createCategory);
inventoryRoutes.get("/categories", inventoryController.getCategories);
inventoryRoutes.put("/categories/:id", authenticateJWT, inventoryController.updateCategory);
inventoryRoutes.delete("/categories/:id", authenticateJWT, inventoryController.deleteCategory);

//Medicine Categories Counts
inventoryRoutes.get("/categories/counts", inventoryController.getCategoriesCount);

// Medicine Routes
inventoryRoutes.post("/medicines", authenticateJWT, inventoryController.createMedicine);
inventoryRoutes.get("/medicines", inventoryController.getMedicines);
inventoryRoutes.get("/medicines/:id", inventoryController.getMedicineById);
inventoryRoutes.put("/medicines/:id", authenticateJWT, inventoryController.updateMedicine);
inventoryRoutes.delete("/medicines/:id", authenticateJWT, inventoryController.deleteMedicine);
inventoryRoutes.get("/medicines-expired", inventoryController.getMedicinesExpired);

//Medical Transcations
inventoryRoutes.post("/transactions/add", authenticateJWT, inventoryController.addStock); 
inventoryRoutes.post("/transactions/use", authenticateJWT, inventoryController.useMedicine); 
inventoryRoutes.post("/transactions/remove", authenticateJWT, inventoryController.removeStock);
inventoryRoutes.get("/transactions/", authenticateJWT, inventoryController.getTransactions);

//Medicine Batches
inventoryRoutes.get("/medicine/batch/:id", authenticateJWT, inventoryController.getBatchesById);  // ✅ Get all batches for a medicine
inventoryRoutes.get("/medicine/batch/", authenticateJWT, inventoryController.getBatches);  // ✅ Get all batches for a medicine
inventoryRoutes.put("/medicine/batch/update/:id", authenticateJWT, inventoryController.updateBatch);   // ✅ Update batch details
inventoryRoutes.delete("/medicine/batch/delete/:id", authenticateJWT, inventoryController.deleteBatch); // ✅ Delete batch
inventoryRoutes.delete("/medicine/batch/expired/delete/:id", authenticateJWT, inventoryController.deleteBatchById);




export default inventoryRoutes
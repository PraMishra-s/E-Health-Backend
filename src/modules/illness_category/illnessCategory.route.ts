import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { illnessCategoryController } from "./illnessCategory.module";


const illnessCategoryRoute = Router();

// Illness Category Routes

illnessCategoryRoute.post("/create", authenticateJWT, illnessCategoryController.createCategory);
illnessCategoryRoute.get("/", authenticateJWT, illnessCategoryController.getAllCategories);
illnessCategoryRoute.put("/update/:id", authenticateJWT, illnessCategoryController.updateCategory);
illnessCategoryRoute.delete("/delete/:id", authenticateJWT, illnessCategoryController.deleteCategory)


export default illnessCategoryRoute;

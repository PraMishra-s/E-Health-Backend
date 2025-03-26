import { Router } from "express";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";
import { staffController } from "./staff.module";




const StaffRoute = Router();


StaffRoute.post("/create/",authenticateJWT, staffController.createFamilyMember);


StaffRoute.get("/:staff_id",authenticateJWT, staffController.getFamilyMembers);
StaffRoute.get("/all/:staff_id", authenticateJWT, staffController.getAllFamilyMembers)


StaffRoute.put("/update/:id",authenticateJWT, staffController.updateFamilyMember);


StaffRoute.delete("/delete/:id",authenticateJWT, staffController.deleteFamilyMember);
StaffRoute.delete("/hard-delete/:id", authenticateJWT, staffController.hardDeleteFamilyMember);


export default StaffRoute;

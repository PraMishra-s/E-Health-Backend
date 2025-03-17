import { Router } from "express";
import { illnessController } from "./illness.module";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";


const illnessRoute = Router();

illnessRoute.post("/create/",authenticateJWT, illnessController.createIllness);
illnessRoute.get("/",authenticateJWT, illnessController.getIllnesses);
illnessRoute.get("/:id",authenticateJWT, illnessController.getIllnessById);
illnessRoute.put("/update/:id",authenticateJWT, illnessController.updateIllness);
illnessRoute.delete("/delete/:id",authenticateJWT, illnessController.deleteIllness);

export default illnessRoute;

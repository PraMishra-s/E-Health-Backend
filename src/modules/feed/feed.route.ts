import { Router } from "express";
import { feedController } from "./feed.module";
import { authenticateJWT } from "../../common/strageties/jwt.strategy";

const feedRoutes = Router();


feedRoutes.post("/create", authenticateJWT, feedController.createFeed);
feedRoutes.put("/update/:id", authenticateJWT, feedController.updateFeed);
feedRoutes.delete("/delete/:id", authenticateJWT, feedController.deleteFeed);
feedRoutes.delete("/deleteAll/all", authenticateJWT, feedController.deleteAllFeeds);


feedRoutes.get("/", feedController.getFeeds);

export default feedRoutes;

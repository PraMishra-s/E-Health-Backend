import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";


const inventoryService = new InventoryService();
const inventoryController = new InventoryController(inventoryService);
export {inventoryService, inventoryController };
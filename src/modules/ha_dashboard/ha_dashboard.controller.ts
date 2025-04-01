import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { Request, Response } from "express";
import { HaDashboardService } from "./ha_dashboard.service";

export class HaDashboardController{
    private haDashboardService
    constructor(haDashboardService: HaDashboardService){
        this.haDashboardService = haDashboardService
    }

    public getAnalytics = asyncHandler(async (req: Request, res: Response) =>{
        const data = await this.haDashboardService.getAnalytics();
        return res.status(HTTPSTATUS.OK).json({
            data
        })
    
    });
}